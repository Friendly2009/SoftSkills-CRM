import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "../core/api.js";
import { recordTables, record } from "../core/records.js";
import { rows } from "../core/db.js";
import { permit, scoped } from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  id,
  note,
  instant,
  sqlTime,
  pageQuery,
  json,
} from "../core/validation.js";
import { redact } from "./resources.js";
import { validateEnrollment } from "./enrollments.js";

export function cardRoutes(app: Express) {
  const page = pageQuery.pick({ page: true, pageSize: true });
  for (const resource of Object.keys(recordTables)) {
    const prefix =
      resource === "organization" ? "/organization" : `/${resource}/:id`;
    const target = (c: any) =>
      resource === "organization" ? c.actor.org : String(c.req.params.id);
    route(
      app,
      "post",
      prefix + "/archive",
      {
        body: z.object({}).strict(),
        summary: `Archive ${resource}; preserve history`,
      },
      async (c) => {
        permit(
          c.actor,
          ...(["organization", "branches", "rooms", "staff"].includes(resource)
            ? ["director"]
            : ["director", "manager"]),
        );
        const row = await record(c, resource, target(c));
        if (resource === "people")
          assert(
            row.id !== c.actor.personId,
            409,
            "SELF_ARCHIVE",
            "Cannot archive your own person",
          );
        if (resource === "payer-students") {
          const s = await scoped(c.db, c.actor, "students", row.student_id);
          assert(
            s.payer_id !== row.payer_id,
            409,
            "PRIMARY_PAYER",
            "Choose another primary payer before archiving this link",
          );
        }
        const where =
          resource === "organization" ? "id=?" : "org_id=? AND id=?";
        await c.db.execute(
          `UPDATE crm_${recordTables[resource]} SET archived_at=UTC_TIMESTAMP(3) WHERE ${where}`,
          resource === "organization" ? [row.id] : [c.actor.org, row.id],
        );
        return { id: row.id, archived: true };
      },
    );
    route(
      app,
      "get",
      prefix + "/history",
      { query: page, summary: `Read immutable ${resource} history` },
      async (c, _, q) => {
        permit(c.actor, "director", "manager", "teacher");
        await record(c, resource, target(c));
        const args = [c.actor.org, resource, target(c)];
        const count = (
          await rows(
            c.db,
            "SELECT COUNT(*) n FROM crm_record_history WHERE org_id=? AND resource=? AND resource_id=?",
            args,
          )
        )[0]!;
        const items = await rows(
          c.db,
          `SELECT h.*,p.name AS author_name FROM crm_record_history h JOIN crm_users u ON u.org_id=h.org_id AND u.id=h.author_id JOIN crm_people p ON p.org_id=u.org_id AND p.id=u.person_id WHERE h.org_id=? AND h.resource=? AND h.resource_id=? ORDER BY h.created_at DESC,h.id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
          args,
        );
        return {
          items: items.map((h) => ({
            ...h,
            before_data: h.before_data
              ? redact(c, resource, json(h.before_data))
              : null,
            after_data: redact(c, resource, json(h.after_data)),
          })),
          page: q.page,
          pageSize: q.pageSize,
          total: Number(count.n),
        };
      },
    );
    route(
      app,
      "get",
      prefix + "/comments",
      {
        query: page,
        summary: `Read ${resource} comments with author and server timestamp`,
      },
      async (c, _, q) => {
        permit(c.actor, "director", "manager", "teacher");
        await record(c, resource, target(c));
        const args = [c.actor.org, resource, target(c)];
        const count = (
          await rows(
            c.db,
            "SELECT COUNT(*) n FROM crm_comments WHERE org_id=? AND resource=? AND resource_id=?",
            args,
          )
        )[0]!;
        const items = await rows(
          c.db,
          `SELECT x.id,x.text,x.author_id,p.name AS author_name,x.created_at FROM crm_comments x JOIN crm_users u ON u.org_id=x.org_id AND u.id=x.author_id JOIN crm_people p ON p.org_id=u.org_id AND p.id=u.person_id WHERE x.org_id=? AND x.resource=? AND x.resource_id=? ORDER BY x.created_at DESC,x.id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
          args,
        );
        return {
          items,
          page: q.page,
          pageSize: q.pageSize,
          total: Number(count.n),
        };
      },
    );
    route(
      app,
      "post",
      prefix + "/comments",
      {
        body: z.object({ text: z.string().trim().min(1).max(4000) }).strict(),
        summary: `Append ${resource} comment`,
      },
      async (c, b) => {
        permit(c.actor, "director", "manager", "teacher");
        await record(c, resource, target(c));
        const commentId = randomUUID();
        await c.db.execute(
          "INSERT INTO crm_comments(id,org_id,author_id,resource,resource_id,text) VALUES(?,?,?,?,?,?)",
          [commentId, c.actor.org, c.actor.id, resource, target(c), b.text],
        );
        return (
          await rows(
            c.db,
            "SELECT id,author_id,text,created_at FROM crm_comments WHERE org_id=? AND id=?",
            [c.actor.org, commentId],
          )
        )[0];
      },
    );
  }
  route(
    app,
    "patch",
    "/payers/:id",
    {
      body: z.object({ comment: note }).strict(),
      summary: "Update payer notes; identity is edited through people",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      await c.db.execute(
        "UPDATE crm_payers SET comment=? WHERE org_id=? AND id=?",
        [b.comment, c.actor.org, c.req.params.id],
      );
      return { id: c.req.params.id };
    },
  );
  route(
    app,
    "patch",
    "/students/:id",
    {
      body: z.object({ payerId: id, active: z.boolean() }).strict(),
      summary: "Change primary billing payer or student activity",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const student = await scoped(
        c.db,
        c.actor,
        "students",
        String(c.req.params.id),
      );
      const payer = await scoped(c.db, c.actor, "payers", b.payerId);
      assert(!payer.archived_at, 409, "PAYER_INVALID", "Payer must be active");
      await c.db.execute(
        "UPDATE crm_students SET payer_id=?,active=? WHERE org_id=? AND id=?",
        [payer.id, b.active, c.actor.org, student.id],
      );
      const link = (
        await rows(
          c.db,
          "SELECT * FROM crm_payer_students WHERE org_id=? AND student_id=? AND payer_id=?",
          [c.actor.org, student.id, payer.id],
        )
      )[0];
      assert(
        !link?.archived_at,
        409,
        "LINK_ARCHIVED",
        "Payer relationship is archived",
      );
      if (!link)
        await c.db.execute(
          "INSERT INTO crm_payer_students(id,org_id,branch_id,payer_id,student_id) VALUES(UUID(),?,?,?,?)",
          [c.actor.org, student.branch_id, payer.id, student.id],
        );
      return { id: student.id };
    },
  );
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/payer-students" + (method === "patch" ? "/:id" : ""),
      {
        body:
          method === "post"
            ? z
                .object({
                  payerId: id,
                  studentId: id,
                  relationship: z.string().trim().max(100).default(""),
                })
                .strict()
            : z.object({ relationship: z.string().trim().max(100) }).strict(),
        summary:
          "Create or edit payer-student relationship without duplicating people",
      },
      async (c, b) => {
        permit(c.actor, "director", "manager");
        if (method === "patch") {
          await c.db.execute(
            "UPDATE crm_payer_students SET relationship=? WHERE org_id=? AND id=?",
            [b.relationship, c.actor.org, c.req.params.id],
          );
          return { id: c.req.params.id };
        }
        const payer = await scoped(c.db, c.actor, "payers", b.payerId);
        const student = await scoped(c.db, c.actor, "students", b.studentId);
        assert(
          !payer.archived_at && !student.archived_at && student.active,
          409,
          "LINK_INVALID",
          "Payer and student must be active",
        );
        const linkId = randomUUID();
        await c.db.execute(
          "INSERT INTO crm_payer_students(id,org_id,branch_id,payer_id,student_id,relationship) VALUES(?,?,?,?,?,?)",
          [
            linkId,
            c.actor.org,
            student.branch_id,
            payer.id,
            student.id,
            b.relationship,
          ],
        );
        return { id: linkId };
      },
    );
  const period = z
    .object({ startsAt: instant, endsAt: instant.nullable() })
    .strict();
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/enrollments" + (method === "patch" ? "/:id" : ""),
      {
        body:
          method === "post"
            ? period.extend({ groupId: id, studentId: id })
            : period,
        summary:
          "Create/update membership period with serialized capacity and overlap checks",
      },
      async (c, b) => {
        permit(c.actor, "director", "manager");
        const old =
          method === "patch"
            ? await scoped(c.db, c.actor, "members", String(c.req.params.id))
            : null;
        const start = sqlTime(b.startsAt),
          end = b.endsAt ? sqlTime(b.endsAt) : null;
        const group = await validateEnrollment(
          c,
          old?.group_id ?? b.groupId,
          old?.student_id ?? b.studentId,
          start,
          end,
          old?.id,
        );
        const memberId = old?.id ?? randomUUID();
        if (old)
          await c.db.execute(
            "UPDATE crm_members SET starts_at=?,ends_at=? WHERE org_id=? AND id=?",
            [start, end, c.actor.org, old.id],
          );
        else
          await c.db.execute(
            "INSERT INTO crm_members(id,org_id,branch_id,group_id,student_id,starts_at,ends_at) VALUES(?,?,?,?,?,?,?)",
            [
              memberId,
              c.actor.org,
              group.branch_id,
              group.id,
              b.studentId,
              start,
              end,
            ],
          );
        return { id: memberId };
      },
    );
}
