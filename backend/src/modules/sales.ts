import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, scoped, get, branch, has, actor } from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  id,
  text,
  note,
  date,
  instant,
  sqlTime,
  isoTime,
} from "../core/validation.js";
import {
  personSchema,
  createPerson,
  ensurePayer,
  ensureStudent,
} from "./people.js";
import { notifyStaff } from "./collaboration.js";
import { visible, visibility } from "./resources.js";
export const stages = z.enum([
  "Не разобран",
  "Назначен контакт",
  "Назначена проба",
  "Проведена проба",
  "Получена оплата",
  "Отказ",
]);
export function salesRoutes(app: Express) {
  route(
    app,
    "get",
    "/subscriptions/:id/usage",
    {
      query: z
        .object({
          page: z.coerce.number().int().min(1).max(100000).default(1),
          pageSize: z.coerce.number().int().min(1).max(100).default(25),
        })
        .strict(),
      summary: "Paginated immutable subscription usage and returns",
    },
    async (c, _, q) => {
      const sub = await visible(c, "subscriptions", String(c.req.params.id));
      const args = [c.actor.org, sub.id];
      const total = Number(
        (
          await rows(
            c.db,
            "SELECT COUNT(*) n FROM crm_subscription_usage WHERE org_id=? AND subscription_id=?",
            args,
          )
        )[0]?.n,
      );
      const items = await rows(
        c.db,
        `SELECT id,lesson_id,revision,delta,created_at FROM crm_subscription_usage WHERE org_id=? AND subscription_id=? ORDER BY created_at,id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        args,
      );
      return { items, total, page: q.page, pageSize: q.pageSize };
    },
  );
  route(
    app,
    "get",
    "/lead-stages",
    { summary: "Exact ordered frontend pipeline stages" },
    async (c) => {
      permit(c.actor, "director", "manager");
      return stages.options;
    },
  );
  route(
    app,
    "get",
    "/pipeline",
    {
      query: z.object({ branchId: id.optional() }).strict(),
      summary: "Scoped lead counts by frontend stage; archived leads excluded",
    },
    async (c, _, q) => {
      const { where, args } = visibility(c, "leads");
      where.push("r.archived_at IS NULL");
      if (q.branchId) {
        where.push("r.branch_id=?");
        args.push(q.branchId);
      }
      const counts = await rows(
        c.db,
        `SELECT r.status,COUNT(*) total FROM crm_leads r WHERE ${where.join(" AND ")} GROUP BY r.status`,
        args,
      );
      return {
        stages: stages.options.map((status) => ({
          status,
          total: Number(counts.find((v) => v.status === status)?.total ?? 0),
        })),
      };
    },
  );
  route(
    app,
    "post",
    "/leads",
    {
      body: z
        .object({
          person: personSchema.optional(),
          personId: id.optional(),
          source: z.string().max(255).default(""),
          responsibleId: id.nullable().default(null),
          comment: note,
        })
        .strict(),
      summary: "Create lead with a new person or explicitly selected personId",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      assert(
        !!b.person !== !!b.personId,
        400,
        "PERSON_SELECTION",
        "Provide exactly one of person or personId",
      );
      const p = b.personId
        ? await scoped(c.db, c.actor, "people", b.personId)
        : await createPerson(c, b.person);
      const person = await scoped(c.db, c.actor, "people", p.id);
      assert(
        person.active && !person.archived_at,
        409,
        "PERSON_INACTIVE",
        "Person is inactive",
      );
      if (b.responsibleId) {
        const staff = await scoped(c.db, c.actor, "staff", b.responsibleId);
        assert(
          staff.branch_id === person.branch_id &&
            staff.status === "Работает" &&
            !staff.archived_at,
          409,
          "RESPONSIBLE_INVALID",
          "Active responsible staff must match lead branch",
        );
      }
      const leadId = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_leads(id,org_id,person_id,branch_id,name,source,comment,responsible_id) VALUES(?,?,?,?,?,?,?,?)",
        [
          leadId,
          c.actor.org,
          p.id,
          person.branch_id,
          person.name,
          b.source,
          b.comment,
          b.responsibleId,
        ],
      );
      return { id: leadId, personId: p.id };
    },
  );
  route(
    app,
    "patch",
    "/leads/:id",
    {
      body: z
        .object({
          status: stages,
          source: z.string().max(255),
          comment: note,
          responsibleId: id.nullable(),
        })
        .strict(),
      summary: "Update lead stage and responsible staff",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const lead = await scoped(
        c.db,
        c.actor,
        "leads",
        String(c.req.params.id),
      );
      if (b.responsibleId) {
        const staff = await scoped(c.db, c.actor, "staff", b.responsibleId);
        assert(
          staff.branch_id === lead.branch_id &&
            staff.status === "Работает" &&
            !staff.archived_at,
          409,
          "RESPONSIBLE_INVALID",
          "Active responsible staff must match lead branch",
        );
      }
      await c.db.execute(
        "UPDATE crm_leads SET status=?,source=?,comment=?,responsible_id=? WHERE org_id=? AND id=?",
        [
          b.status,
          b.source,
          b.comment,
          b.responsibleId,
          c.actor.org,
          c.req.params.id,
        ],
      );
      return { id: c.req.params.id };
    },
  );
  route(
    app,
    "post",
    "/leads/:id/convert",
    {
      idem: true,
      body: z
        .object({
          mode: z.enum(["payer", "payer-student"]).default("payer-student"),
          studentPersonId: id.optional(),
          payerPersonId: id.optional(),
        })
        .strict(),
      summary: "Convert lead using existing person/payer/student identities",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      assert(
        b.mode !== "payer" || !b.studentPersonId,
        400,
        "CONVERSION_MODE",
        "payer conversion cannot specify studentPersonId",
      );
      const l = await scoped(c.db, c.actor, "leads", String(c.req.params.id));
      if (l.payer_id) {
        const oldPayer = await scoped(c.db, c.actor, "payers", l.payer_id);
        const oldStudent = l.student_id
          ? await scoped(c.db, c.actor, "students", l.student_id)
          : null;
        assert(
          (!b.payerPersonId || b.payerPersonId === oldPayer.person_id) &&
            (!b.studentPersonId ||
              b.studentPersonId === oldStudent?.person_id) &&
            (b.mode === "payer" ? !oldStudent : !!oldStudent),
          409,
          "ALREADY_CONVERTED",
          "Lead already converted with different targets",
        );
        return { leadId: l.id, payerId: l.payer_id, studentId: l.student_id };
      }
      const payerPerson = await scoped(
        c.db,
        c.actor,
        "people",
        b.payerPersonId ?? l.person_id,
      );
      assert(
        payerPerson.branch_id === l.branch_id,
        409,
        "BRANCH_MISMATCH",
        "Conversion targets must belong to lead branch",
      );
      if (b.mode !== "payer") {
        const studentPerson = await scoped(
          c.db,
          c.actor,
          "people",
          b.studentPersonId ?? l.person_id,
        );
        assert(
          studentPerson.branch_id === l.branch_id,
          409,
          "BRANCH_MISMATCH",
          "Conversion targets must belong to lead branch",
        );
      }
      const payer = await ensurePayer(c, payerPerson.id);
      const student =
        b.mode === "payer"
          ? null
          : await ensureStudent(c, b.studentPersonId ?? l.person_id, payer);
      await c.db.execute(
        "UPDATE crm_leads SET student_id=?,payer_id=? WHERE org_id=? AND id=?",
        [student, payer, c.actor.org, l.id],
      );
      return { leadId: l.id, payerId: payer, studentId: student };
    },
  );
  const task = z
    .object({
      branchId: id,
      name: text,
      date,
      responsibleId: id.nullable().default(null),
      personId: id.nullable().default(null),
      studentId: id.nullable().default(null),
      payerId: id.nullable().default(null),
      priority: z.enum(["Обычный", "Высокий", "Низкий"]).default("Обычный"),
      status: z.enum(["Новая", "В работе", "Выполнена"]).default("Новая"),
      comment: note,
    })
    .strict();
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/tasks" + (method === "patch" ? "/:id" : ""),
      { body: task, summary: "Create/update CRM task" },
      async (c, b) => {
        permit(c.actor, "director", "manager");
        branch(c.actor, b.branchId);
        await get(c.db, c.actor, "branches", b.branchId);
        if (b.responsibleId)
          await scoped(c.db, c.actor, "staff", b.responsibleId);
        for (const [key, table] of [
          ["personId", "people"],
          ["payerId", "payers"],
          ["studentId", "students"],
          ["responsibleId", "staff"],
        ]) {
          if (b[key!]) {
            const linked = await scoped(c.db, c.actor, table!, b[key!]);
            assert(
              linked.branch_id === b.branchId &&
                !linked.archived_at &&
                linked.active !== 0 &&
                (table !== "staff" || linked.status === "Работает"),
              409,
              "TASK_REFERENCE_INVALID",
              "Task links must be active and in the same branch",
            );
          }
        }
        if (b.responsibleId) {
          const staff = await scoped(c.db, c.actor, "staff", b.responsibleId);
          const users = await rows(
            c.db,
            "SELECT * FROM crm_users WHERE org_id=? AND person_id=? AND active=TRUE",
            [c.actor.org, staff.person_id],
          );
          for (const user of users) {
            const assignee = actor(user);
            assert(
              has(assignee, "director", "manager", "teacher"),
              409,
              "ASSIGNEE_ROLE",
              "Assignee needs a staff role",
            );
            branch(assignee, b.branchId);
            for (const [key, resource] of [
              ["personId", "people"],
              ["studentId", "students"],
              ["payerId", "payers"],
            ]) {
              if (b[key!])
                await visible({ ...c, actor: assignee }, resource!, b[key!]);
            }
          }
        }
        const taskId =
          method === "post" ? randomUUID() : String(c.req.params.id);
        if (method === "patch") await scoped(c.db, c.actor, "tasks", taskId);
        if (method === "post")
          await c.db.execute(
            "INSERT INTO crm_tasks(id,org_id,branch_id,name,date,responsible_id,person_id,priority,status,comment,student_id,payer_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            [
              taskId,
              c.actor.org,
              b.branchId,
              b.name,
              b.date,
              b.responsibleId,
              b.personId,
              b.priority,
              b.status,
              b.comment,
              b.studentId,
              b.payerId,
            ],
          );
        else
          await c.db.execute(
            "UPDATE crm_tasks SET branch_id=?,name=?,date=?,responsible_id=?,person_id=?,priority=?,status=?,comment=?,student_id=?,payer_id=? WHERE org_id=? AND id=?",
            [
              b.branchId,
              b.name,
              b.date,
              b.responsibleId,
              b.personId,
              b.priority,
              b.status,
              b.comment,
              b.studentId,
              b.payerId,
              c.actor.org,
              taskId,
            ],
          );
        if (b.responsibleId)
          await notifyStaff(c, b.responsibleId, `Назначена задача: ${b.name}`);
        return { id: taskId };
      },
    );
  route(
    app,
    "patch",
    "/tasks/:id/status",
    {
      body: z
        .object({ status: z.enum(["Новая", "В работе", "Выполнена"]) })
        .strict(),
      summary: "Assigned teacher or manager updates task status",
    },
    async (c, b) => {
      await visible(c, "tasks", String(c.req.params.id));
      await c.db.execute(
        "UPDATE crm_tasks SET status=? WHERE org_id=? AND id=?",
        [b.status, c.actor.org, c.req.params.id],
      );
      return { id: c.req.params.id };
    },
  );
  route(
    app,
    "post",
    "/subscriptions",
    {
      body: z
        .object({ studentId: id, templateId: id, startsAt: instant })
        .strict(),
      summary: "Assign lesson allowance, independently from monetary balance",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const s = await scoped(c.db, c.actor, "students", b.studentId);
      const t = await scoped(
        c.db,
        c.actor,
        "subscription_templates",
        b.templateId,
      );
      assert(
        t.active && s.active && !s.archived_at && t.branch_id === s.branch_id,
        409,
        "TEMPLATE_INVALID",
        "Inactive template or branch mismatch",
      );
      const subId = randomUUID();
      const end = new Date(
        new Date(b.startsAt).getTime() + t.days * 86400000,
      ).toISOString();
      await c.db.execute(
        "INSERT INTO crm_subscriptions(id,org_id,branch_id,student_id,template_id,starts_at,ends_at,allowance,group_id,subject) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          subId,
          c.actor.org,
          s.branch_id,
          s.id,
          t.id,
          sqlTime(b.startsAt),
          sqlTime(end),
          t.lessons,
          t.group_id,
          t.subject,
        ],
      );
      return { id: subId, endsAt: end };
    },
  );
  route(
    app,
    "post",
    "/subscriptions/:id/freeze",
    {
      idem: true,
      body: z.object({}).strict(),
      summary: "Freeze now, disallowing usage during freeze interval",
    },
    async (c) => {
      permit(c.actor, "director", "manager");
      const sub = await scoped(
        c.db,
        c.actor,
        "subscriptions",
        String(c.req.params.id),
      );
      assert(!sub.frozen_at, 409, "ALREADY_FROZEN", "Already frozen");
      const now = new Date().toISOString();
      assert(
        Date.parse(isoTime(sub.starts_at)) <= Date.parse(now) &&
          Date.parse(isoTime(sub.ends_at)) > Date.parse(now),
        409,
        "SUBSCRIPTION_EXPIRED",
        "Expired subscription cannot be frozen",
      );
      await c.db.execute(
        "UPDATE crm_subscriptions SET frozen_at=? WHERE org_id=? AND id=?",
        [sqlTime(now), c.actor.org, sub.id],
      );
      await c.db.execute(
        "INSERT INTO crm_freezes(id,org_id,subscription_id,starts_at) VALUES(?,?,?,?)",
        [randomUUID(), c.actor.org, sub.id, sqlTime(now)],
      );
      return { id: sub.id, frozenAt: now };
    },
  );
  route(
    app,
    "post",
    "/subscriptions/:id/unfreeze",
    {
      idem: true,
      body: z.object({}).strict(),
      summary: "Unfreeze now and extend expiry by exact frozen duration",
    },
    async (c) => {
      permit(c.actor, "director", "manager");
      const sub = await scoped(
        c.db,
        c.actor,
        "subscriptions",
        String(c.req.params.id),
      );
      assert(sub.frozen_at, 409, "NOT_FROZEN", "Not frozen");
      const now = new Date().toISOString();
      const duration = Date.parse(now) - Date.parse(isoTime(sub.frozen_at));
      const ends = new Date(
        Date.parse(isoTime(sub.ends_at)) + duration,
      ).toISOString();
      await c.db.execute(
        "UPDATE crm_subscriptions SET frozen_at=NULL,ends_at=? WHERE org_id=? AND id=?",
        [sqlTime(ends), c.actor.org, sub.id],
      );
      await c.db.execute(
        "UPDATE crm_freezes SET ends_at=? WHERE org_id=? AND subscription_id=? AND ends_at IS NULL",
        [sqlTime(now), c.actor.org, sub.id],
      );
      return { id: sub.id, endsAt: ends };
    },
  );
  route(
    app,
    "get",
    "/subscriptions/:id/availability",
    { summary: "Remaining allowance and currently usable count" },
    async (c) => {
      const s = await visible(c, "subscriptions", String(c.req.params.id));
      const used = Number(
        (
          await rows(
            c.db,
            "SELECT COALESCE(SUM(delta),0) AS n FROM crm_subscription_usage WHERE org_id=? AND subscription_id=?",
            [c.actor.org, s.id],
          )
        )[0]?.n,
      );
      const remaining = s.allowance - used;
      const available =
        !s.frozen_at &&
        Date.parse(isoTime(s.starts_at)) <= Date.now() &&
        Date.parse(isoTime(s.ends_at)) > Date.now();
      return {
        id: s.id,
        remaining,
        available: available ? remaining : 0,
        frozen: !!s.frozen_at,
        endsAt: isoTime(s.ends_at),
      };
    },
  );
}
