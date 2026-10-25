import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route, type Context } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, branch, get } from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  id,
  text,
  contacts,
  password,
  pageQuery,
  email,
  phone,
} from "../core/validation.js";
import { hashPassword, verifyPassword } from "../core/security.js";
import { visible } from "./resources.js";
export async function notifyStaff(
  c: Context,
  staffId: string,
  message: string,
) {
  const staff = await get(c.db, c.actor, "staff", staffId);
  const users = await rows(
    c.db,
    "SELECT id FROM crm_users WHERE org_id=? AND person_id=? AND active=TRUE",
    [c.actor.org, staff.person_id],
  );
  for (const user of users)
    await c.db.execute(
      "INSERT INTO crm_notifications(id,org_id,user_id,message) VALUES(?,?,?,?)",
      [randomUUID(), c.actor.org, user.id, message],
    );
}
export function collaborationRoutes(app: Express) {
  route(
    app,
    "get",
    "/profile",
    { summary: "Read current person profile and contacts" },
    async (c) => ({
      person: ((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.name,
        birthday: p.birthday,
      }))(await get(c.db, c.actor, "people", c.actor.personId)),
      contacts: await rows(
        c.db,
        "SELECT kind,value FROM crm_contacts WHERE org_id=? AND person_id=?",
        [c.actor.org, c.actor.personId],
      ),
    }),
  );
  route(
    app,
    "patch",
    "/profile",
    {
      body: z
        .object({ fullName: text, email, phone: phone.nullable().optional() })
        .strict(),
      summary: "Update own name and contacts without changing permissions",
    },
    async (c, b) => {
      await c.db.execute(
        "UPDATE crm_people SET name=? WHERE org_id=? AND id=?",
        [b.fullName, c.actor.org, c.actor.personId],
      );
      await c.db.execute(
        "UPDATE crm_staff SET name=? WHERE org_id=? AND person_id=?",
        [b.fullName, c.actor.org, c.actor.personId],
      );
      await c.db.execute(
        "DELETE FROM crm_contacts WHERE org_id=? AND person_id=?",
        [c.actor.org, c.actor.personId],
      );
      for (const v of [
        { kind: "email", value: b.email },
        ...(b.phone ? [{ kind: "phone", value: b.phone }] : []),
      ])
        await c.db.execute(
          "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
          [randomUUID(), c.actor.org, c.actor.personId, v.kind, v.value],
        );
      return { id: c.actor.personId };
    },
  );
  route(
    app,
    "post",
    "/profile/password",
    {
      body: z
        .object({ currentPassword: z.string().min(1).max(128), password })
        .strict(),
      summary: "Change own password, revoking all sessions",
    },
    async (c, b) => {
      const user = await get(c.db, c.actor, "users", c.actor.id);
      assert(
        await verifyPassword(b.currentPassword, user.password_hash),
        403,
        "INVALID_PASSWORD",
        "Current password incorrect",
      );
      await c.db.execute(
        "UPDATE crm_users SET password_hash=? WHERE org_id=? AND id=?",
        [await hashPassword(b.password), c.actor.org, c.actor.id],
      );
      await c.db.execute("DELETE FROM crm_sessions WHERE user_id=?", [
        c.actor.id,
      ]);
      return { changed: true, signInRequired: true };
    },
  );
  const announcement = z
    .object({
      branchId: id,
      name: text,
      description: z.string().min(1).max(10000),
      active: z.boolean().default(true),
    })
    .strict();
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/announcements" + (method === "patch" ? "/:id" : ""),
      { body: announcement, summary: "Create/update internal announcement" },
      async (c, b) => {
        permit(c.actor, "director", "manager");
        branch(c.actor, b.branchId);
        await get(c.db, c.actor, "branches", b.branchId);
        const entityId =
          method === "post" ? randomUUID() : String(c.req.params.id);
        if (method === "patch") {
          await visible(c, "announcements", entityId);
          await c.db.execute(
            "UPDATE crm_announcements SET branch_id=?,name=?,description=?,active=? WHERE org_id=? AND id=?",
            [
              b.branchId,
              b.name,
              b.description,
              b.active,
              c.actor.org,
              entityId,
            ],
          );
        } else
          await c.db.execute(
            "INSERT INTO crm_announcements(id,org_id,branch_id,name,description,active) VALUES(?,?,?,?,?,?)",
            [
              entityId,
              c.actor.org,
              b.branchId,
              b.name,
              b.description,
              b.active,
            ],
          );
        return { id: entityId };
      },
    );
  const resource = z.enum([
    "people",
    "payers",
    "students",
    "groups",
    "lessons",
    "leads",
    "tasks",
  ]);
  route(
    app,
    "post",
    "/comments",
    {
      body: z
        .object({
          resource,
          resourceId: id,
          text: z.string().trim().min(1).max(4000),
        })
        .strict(),
      summary: "Append internal comment to an accessible record",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager", "teacher");
      await visible(c, b.resource, b.resourceId);
      const commentId = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_comments(id,org_id,author_id,resource,resource_id,text) VALUES(?,?,?,?,?,?)",
        [commentId, c.actor.org, c.actor.id, b.resource, b.resourceId, b.text],
      );
      return { id: commentId };
    },
  );
  route(
    app,
    "get",
    "/comments",
    {
      query: pageQuery
        .pick({ page: true, pageSize: true })
        .extend({ resource, resourceId: id }),
      summary: "Paginated comments on an accessible record",
    },
    async (c, _, q) => {
      permit(c.actor, "director", "manager", "teacher");
      await visible(c, q.resource, q.resourceId);
      const items = await rows(
        c.db,
        `SELECT id,author_id,text,created_at FROM crm_comments WHERE org_id=? AND resource=? AND resource_id=? ORDER BY created_at DESC,id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        [c.actor.org, q.resource, q.resourceId],
      );
      return { items, page: q.page, pageSize: q.pageSize };
    },
  );
  route(
    app,
    "get",
    "/notifications",
    {
      query: pageQuery.pick({ page: true, pageSize: true }),
      summary: "List own internal notifications",
    },
    async (c, _, q) => ({
      items: await rows(
        c.db,
        `SELECT id,message,read_at,created_at FROM crm_notifications WHERE org_id=? AND user_id=? ORDER BY created_at DESC,id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        [c.actor.org, c.actor.id],
      ),
      page: q.page,
      pageSize: q.pageSize,
    }),
  );
  route(
    app,
    "post",
    "/notifications/read",
    {
      body: z.object({ ids: z.array(id).min(1).max(100) }).strict(),
      summary: "Mark only own notifications as read",
    },
    async (c, b) => {
      const found = await rows(
        c.db,
        `SELECT id FROM crm_notifications WHERE org_id=? AND user_id=? AND id IN(${b.ids.map(() => "?").join(",")})`,
        [c.actor.org, c.actor.id, ...b.ids],
      );
      assert(
        found.length === new Set(b.ids).size,
        404,
        "NOT_FOUND",
        "Notification not found",
      );
      await c.db.execute(
        `UPDATE crm_notifications SET read_at=COALESCE(read_at,UTC_TIMESTAMP(3)) WHERE org_id=? AND user_id=? AND id IN(${b.ids.map(() => "?").join(",")})`,
        [c.actor.org, c.actor.id, ...b.ids],
      );
      return { marked: found.length };
    },
  );
}
