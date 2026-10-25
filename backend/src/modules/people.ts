import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { route, type Context } from "../core/api.js";
import { rows } from "../core/db.js";
import {
  permit,
  scoped,
  get,
  branch,
  has,
  hashPassword,
} from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  id,
  text,
  date,
  note,
  contacts,
  roles,
  password,
  money,
} from "../core/validation.js";
export const personSchema = z
  .object({
    branchId: id,
    name: text,
    birthday: date.nullable().default(null),
    comment: note,
    contacts,
  })
  .strict();
export async function createPerson(
  c: Context,
  b: z.infer<typeof personSchema>,
  reuse = false,
) {
  branch(c.actor, b.branchId);
  await get(c.db, c.actor, "branches", b.branchId);
  const matches = new Set<string>();
  for (const contact of b.contacts) {
    const row = (
      await rows(
        c.db,
        "SELECT person_id FROM crm_contacts WHERE org_id=? AND kind=? AND value=?",
        [c.actor.org, contact.kind, contact.value],
      )
    )[0];
    if (row) matches.add(row.person_id);
  }
  assert(
    matches.size <= 1,
    409,
    "CONTACT_CONFLICT",
    "Contacts belong to different people",
  );
  if (matches.size) {
    const personId = [...matches][0]!;
    assert(
      reuse,
      409,
      "CONTACT_EXISTS",
      "A contact already belongs to a person",
    );
    await scoped(c.db, c.actor, "people", personId);
    for (const contact of b.contacts) {
      const exists = (
        await rows(
          c.db,
          "SELECT id FROM crm_contacts WHERE org_id=? AND kind=? AND value=?",
          [c.actor.org, contact.kind, contact.value],
        )
      )[0];
      if (!exists)
        await c.db.execute(
          "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
          [randomUUID(), c.actor.org, personId, contact.kind, contact.value],
        );
    }
    return { id: personId, reused: true };
  }
  const personId = randomUUID();
  await c.db.execute(
    "INSERT INTO crm_people(id,org_id,branch_id,name,birthday,comment) VALUES(?,?,?,?,?,?)",
    [personId, c.actor.org, b.branchId, b.name, b.birthday, b.comment],
  );
  for (const v of b.contacts)
    await c.db.execute(
      "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
      [randomUUID(), c.actor.org, personId, v.kind, v.value],
    );
  return { id: personId, reused: false };
}
export async function ensurePayer(c: Context, personId: string) {
  const p = await scoped(c.db, c.actor, "people", personId);
  const old = (
    await rows(
      c.db,
      "SELECT id FROM crm_payers WHERE org_id=? AND person_id=?",
      [c.actor.org, personId],
    )
  )[0];
  if (old) return old.id as string;
  const payerId = randomUUID();
  await c.db.execute(
    "INSERT INTO crm_payers(id,org_id,person_id,branch_id) VALUES(?,?,?,?)",
    [payerId, c.actor.org, personId, p.branch_id],
  );
  await c.db.execute(
    "INSERT INTO crm_accounts(id,org_id,kind,branch_id,person_id,name) VALUES(?,?,'payer',?,?,?)",
    [payerId, c.actor.org, p.branch_id, personId, p.name],
  );
  return payerId;
}
export async function ensureStudent(
  c: Context,
  personId: string,
  payerId: string,
) {
  const p = await scoped(c.db, c.actor, "people", personId);
  await scoped(c.db, c.actor, "payers", payerId);
  const old = (
    await rows(
      c.db,
      "SELECT * FROM crm_students WHERE org_id=? AND person_id=?",
      [c.actor.org, personId],
    )
  )[0];
  if (old) {
    assert(
      old.payer_id === payerId,
      409,
      "PAYER_CONFLICT",
      "Student already has a different payer",
    );
    return old.id as string;
  }
  const studentId = randomUUID();
  await c.db.execute(
    "INSERT INTO crm_students(id,org_id,person_id,branch_id,payer_id) VALUES(?,?,?,?,?)",
    [studentId, c.actor.org, personId, p.branch_id, payerId],
  );
  return studentId;
}
export function peopleRoutes(app: Express) {
  route(
    app,
    "post",
    "/people",
    {
      body: personSchema,
      summary: "Create a person with unique normalized contacts",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      return createPerson(c, b);
    },
  );
  route(
    app,
    "patch",
    "/people/:id",
    {
      body: personSchema.omit({ branchId: true }),
      summary: "Update person and replace contacts",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      await scoped(c.db, c.actor, "people", String(c.req.params.id));
      await c.db.execute(
        "UPDATE crm_people SET name=?,birthday=?,comment=? WHERE org_id=? AND id=?",
        [b.name, b.birthday, b.comment, c.actor.org, c.req.params.id],
      );
      await c.db.execute(
        "DELETE FROM crm_contacts WHERE org_id=? AND person_id=?",
        [c.actor.org, c.req.params.id],
      );
      for (const v of b.contacts)
        await c.db.execute(
          "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
          [randomUUID(), c.actor.org, c.req.params.id, v.kind, v.value],
        );
      return { id: c.req.params.id };
    },
  );
  route(
    app,
    "post",
    "/payers",
    {
      body: z.object({ personId: id }).strict(),
      summary: "Assign payer role idempotently",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      return { id: await ensurePayer(c, b.personId) };
    },
  );
  route(
    app,
    "post",
    "/students",
    {
      body: z.object({ personId: id, payerId: id }).strict(),
      summary: "Assign student and payer",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      return { id: await ensureStudent(c, b.personId, b.payerId) };
    },
  );
  route(
    app,
    "post",
    "/staff",
    {
      body: z.object({ personId: id, subject: text, rate: money }).strict(),
      summary: "Create staff profile and salary account",
    },
    async (c, b) => {
      permit(c.actor, "director");
      const p = await scoped(c.db, c.actor, "people", b.personId);
      const staffId = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_staff(id,org_id,person_id,branch_id,name,subject,rate) VALUES(?,?,?,?,?,?,?)",
        [staffId, c.actor.org, p.id, p.branch_id, p.name, b.subject, b.rate],
      );
      await c.db.execute(
        "INSERT INTO crm_accounts(id,org_id,kind,branch_id,person_id,name) VALUES(?,?,'payroll',?,?,?)",
        [staffId, c.actor.org, p.branch_id, p.id, p.name],
      );
      return { id: staffId };
    },
  );
  route(
    app,
    "patch",
    "/staff/:id",
    {
      body: z
        .object({
          rate: money,
          subject: text,
          status: z.enum(["Работает", "Отпуск", "Архив"]),
        })
        .strict(),
      summary: "Director changes salary rate and staff status",
    },
    async (c, b) => {
      permit(c.actor, "director");
      await get(c.db, c.actor, "staff", String(c.req.params.id));
      await c.db.execute(
        "UPDATE crm_staff SET rate=?,subject=?,status=? WHERE org_id=? AND id=?",
        [b.rate, b.subject, b.status, c.actor.org, c.req.params.id],
      );
      return { id: c.req.params.id };
    },
  );
  const userSchema = z
    .object({
      personId: id,
      login: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_.@-]{3,100}$/),
      password,
      roles,
      branchIds: z.array(id).max(100).default([]),
    })
    .strict();
  route(
    app,
    "post",
    "/users",
    {
      body: userSchema,
      summary: "Director creates login and assigns roles/branch restrictions",
    },
    async (c, b) => {
      permit(c.actor, "director");
      await get(c.db, c.actor, "people", b.personId);
      for (const v of b.branchIds) await get(c.db, c.actor, "branches", v);
      await validateRoleLinks(c, b.personId, b.roles);
      const userId = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_users(id,org_id,person_id,login,password_hash,roles,branches) VALUES(?,?,?,?,?,?,?)",
        [
          userId,
          c.actor.org,
          b.personId,
          b.login,
          await hashPassword(b.password),
          JSON.stringify(b.roles),
          JSON.stringify(b.branchIds),
        ],
      );
      return { id: userId };
    },
  );
  route(
    app,
    "patch",
    "/users/:id",
    {
      body: z
        .object({
          roles,
          branchIds: z.array(id).max(100),
          active: z.boolean(),
          password: password.optional(),
        })
        .strict(),
      summary: "Director changes roles, restrictions, password or blocks user",
    },
    async (c, b) => {
      permit(c.actor, "director");
      const u = await get(c.db, c.actor, "users", String(c.req.params.id));
      assert(
        u.id !== c.actor.id,
        409,
        "SELF_CHANGE",
        "Use another director to change your permissions",
      );
      for (const v of b.branchIds) await get(c.db, c.actor, "branches", v);
      await validateRoleLinks(c, u.person_id, b.roles);
      await c.db.execute(
        "UPDATE crm_users SET roles=?,branches=?,active=? WHERE org_id=? AND id=?",
        [
          JSON.stringify(b.roles),
          JSON.stringify(b.branchIds),
          b.active,
          c.actor.org,
          u.id,
        ],
      );
      if (b.password)
        await c.db.execute(
          "UPDATE crm_users SET password_hash=? WHERE org_id=? AND id=?",
          [await hashPassword(b.password), c.actor.org, u.id],
        );
      await c.db.execute("DELETE FROM crm_sessions WHERE user_id=?", [u.id]);
      return { id: u.id };
    },
  );
}
async function validateRoleLinks(c: Context, person: string, roles: string[]) {
  for (const [role, table] of [
    ["teacher", "staff"],
    ["payer", "payers"],
    ["student", "students"],
  ])
    if (roles.includes(role!))
      assert(
        (
          await rows(
            c.db,
            `SELECT id FROM crm_${table} WHERE org_id=? AND person_id=?`,
            [c.actor.org, person],
          )
        ).length,
        400,
        "ROLE_LINK_REQUIRED",
        `Create ${role} profile first`,
      );
}
