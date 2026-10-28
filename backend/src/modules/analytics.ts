import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, branch } from "../core/security.js";
import { id, instant, json, sqlTime } from "../core/validation.js";
import { visibility } from "./resources.js";
import { stages } from "./sales.js";
const widgets = z
  .array(z.enum(["lessons", "sales", "finance", "attendance"]))
  .max(4)
  .refine((v) => new Set(v).size === v.length, "Duplicate widget");
export function analyticsRoutes(app: Express) {
  route(
    app,
    "get",
    "/analytics/overview",
    {
      query: z
        .object({ from: instant, to: instant, branchId: id.optional() })
        .strict()
        .refine(
          (v) =>
            Date.parse(v.to) > Date.parse(v.from) &&
            Date.parse(v.to) - Date.parse(v.from) <= 366 * 86400000,
          "Period must be positive and at most 366 days",
        ),
      summary: "Server aggregates for all four new frontend widgets",
    },
    async (c, _, q) => {
      permit(c.actor, "director", "manager");
      if (q.branchId) branch(c.actor, q.branchId);
      const scope = (name: string) => {
        const s = visibility(c, name);
        if (q.branchId) {
          s.where.push("r.branch_id=?");
          s.args.push(q.branchId);
        }
        return s;
      };
      const ls = scope("lessons");
      const lessons = await rows(
        c.db,
        `SELECT r.status,COUNT(*) AS count FROM crm_lessons r WHERE ${ls.where.join(" AND ")} AND r.starts_at>=? AND r.starts_at<? GROUP BY r.status`,
        [...ls.args, sqlTime(q.from), sqlTime(q.to)],
      );
      const attendance = await rows(
        c.db,
        `SELECT a.attendance AS status,COUNT(*) AS count FROM crm_attendees a JOIN crm_lessons r ON r.org_id=a.org_id AND r.id=a.lesson_id WHERE ${ls.where.join(" AND ")} AND r.status='completed' AND r.starts_at>=? AND r.starts_at<? GROUP BY a.attendance`,
        [...ls.args, sqlTime(q.from), sqlTime(q.to)],
      );
      const leads = scope("leads");
      const sales = await rows(
        c.db,
        `SELECT r.status,COUNT(*) AS count FROM crm_leads r WHERE ${leads.where.join(" AND ")} AND EXISTS(SELECT 1 FROM crm_audit a WHERE a.org_id=r.org_id AND a.resource='/leads' AND a.resource_id=r.id AND a.action='post' AND a.created_at>=? AND a.created_at<?) GROUP BY r.status`,
        [...leads.args, sqlTime(q.from), sqlTime(q.to)],
      );
      const accounts = scope("accounts");
      const finance = (
        await rows(
          c.db,
          `SELECT CAST(COALESCE(SUM(IF(COALESCE(original.kind,l.kind)<>'transfer' AND COALESCE(original.amount,l.amount)>0,l.amount,0)),0) AS CHAR) AS income,CAST(COALESCE(-SUM(IF(COALESCE(original.kind,l.kind)<>'transfer' AND COALESCE(original.amount,l.amount)<0,l.amount,0)),0) AS CHAR) AS expense,CAST(COALESCE(SUM(l.amount),0) AS CHAR) AS net,CAST(COALESCE(SUM(IF(COALESCE(original.kind,l.kind)='transfer',l.amount,0)),0) AS CHAR) AS transfersNet FROM crm_ledger l JOIN crm_accounts r ON r.org_id=l.org_id AND r.id=l.account_id LEFT JOIN crm_ledger original ON original.org_id=l.org_id AND original.id=l.reversal_of WHERE ${accounts.where.join(" AND ")} AND r.kind='cash' AND l.created_at>=? AND l.created_at<?`,
          [...accounts.args, sqlTime(q.from), sqlTime(q.to)],
        )
      )[0];
      const ss = scope("students");
      const active = Number(
        (
          await rows(
            c.db,
            `SELECT COUNT(*) AS n FROM crm_students r WHERE ${ss.where.join(" AND ")} AND r.active=TRUE`,
            ss.args,
          )
        )[0]?.n,
      );
      const counts = (statuses: string[], values: any[]) =>
        statuses.map((status) => ({
          status,
          count: Number(values.find((v) => v.status === status)?.count ?? 0),
        }));
      return {
        from: q.from,
        to: q.to,
        activeStudents: active,
        lessons: counts(["scheduled", "completed", "cancelled"], lessons),
        sales: counts(stages.options, sales),
        attendance: counts(["present", "absent", "excused"], attendance),
        finance,
      };
    },
  );
  route(
    app,
    "get",
    "/widgets",
    { summary: "Current user widget selection and order" },
    async (c) => {
      permit(c.actor, "director", "manager");
      const p = (
        await rows(
          c.db,
          "SELECT widgets FROM crm_preferences WHERE org_id=? AND user_id=?",
          [c.actor.org, c.actor.id],
        )
      )[0];
      return {
        ids: p
          ? json(p.widgets)
          : ["lessons", "sales", "finance", "attendance"],
      };
    },
  );
  route(
    app,
    "patch",
    "/widgets",
    {
      body: z.object({ ids: widgets }).strict(),
      summary: "Persist current user widget selection",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      await c.db.execute(
        "INSERT INTO crm_preferences(id,org_id,user_id,widgets) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE widgets=?",
        [
          randomUUID(),
          c.actor.org,
          c.actor.id,
          JSON.stringify(b.ids),
          JSON.stringify(b.ids),
        ],
      );
      return { ids: b.ids };
    },
  );
}
