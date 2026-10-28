import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route, type Context } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, scoped, get, has } from "../core/security.js";
import { assert } from "../core/errors.js";
import { id, text, money } from "../core/validation.js";
import { visible } from "./resources.js";
export async function entry(
  c: Context,
  account: string,
  amount: string,
  kind: string,
  operation: string,
  reason: string,
  lesson: string | null = null,
  revision: number | null = null,
  reversal: string | null = null,
) {
  const entryId = randomUUID();
  await c.db.execute(
    "INSERT INTO crm_ledger(id,org_id,account_id,amount,kind,operation_id,reason,lesson_id,revision,reversal_of) VALUES(?,?,?,?,?,?,?,?,?,?)",
    [
      entryId,
      c.actor.org,
      account,
      amount,
      kind,
      operation,
      reason,
      lesson,
      revision,
      reversal,
    ],
  );
  return entryId;
}
export function financeRoutes(app: Express) {
  route(
    app,
    "post",
    "/accounts",
    {
      body: z.object({ branchId: id, name: text }).strict(),
      summary: "Director creates a cash/bank account",
    },
    async (c, b) => {
      permit(c.actor, "director");
      await get(c.db, c.actor, "branches", b.branchId);
      const accountId = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_accounts(id,org_id,kind,branch_id,name) VALUES(?,?,'cash',?,?)",
        [accountId, c.actor.org, b.branchId, b.name],
      );
      return { id: accountId };
    },
  );
  route(
    app,
    "get",
    "/accounts/:id/balance",
    { summary: "Exact account balance from immutable ledger" },
    async (c) => {
      const a = await visible(c, "accounts", String(c.req.params.id));
      return {
        accountId: a.id,
        balance: (
          await rows(
            c.db,
            "SELECT CAST(COALESCE(SUM(amount),0) AS CHAR) AS balance FROM crm_ledger WHERE org_id=? AND account_id=?",
            [c.actor.org, a.id],
          )
        )[0]?.balance,
      };
    },
  );
  route(
    app,
    "post",
    "/transactions",
    {
      idem: true,
      body: z
        .object({
          kind: z.enum([
            "payment",
            "refund",
            "expense",
            "income",
            "salary_payment",
          ]),
          accountId: id,
          payerId: id.optional(),
          staffId: id.optional(),
          originalPaymentId: id.optional(),
          amount: money.refine((v) => BigInt(v) > 0n),
          reason: z.string().trim().min(1).max(1000),
        })
        .strict(),
      summary: "Record internal payment/refund/cash operation/salary payment",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const cash = await scoped(c.db, c.actor, "accounts", b.accountId);
      assert(
        cash.kind === "cash",
        400,
        "INVALID_ACCOUNT",
        "Cash/bank account required",
      );
      assert(
        b.kind === "refund" || !b.originalPaymentId,
        400,
        "INVALID_ORIGINAL",
        "Original payment only applies to refunds",
      );
      if (["payment", "refund"].includes(b.kind)) {
        assert(
          b.payerId && !b.staffId,
          400,
          "PAYER_REQUIRED",
          "Specify payerId only",
        );
        await scoped(c.db, c.actor, "payers", b.payerId);
      }
      let original: any;
      if (b.kind === "refund") {
        await checkLegacyRefunds(c, b.payerId);
        assert(
          b.originalPaymentId,
          400,
          "ORIGINAL_PAYMENT_REQUIRED",
          "Specify originalPaymentId (payment operationId)",
        );
        original = (
          await rows(
            c.db,
            `SELECT l.* FROM crm_ledger l JOIN crm_accounts a ON a.org_id=l.org_id AND a.id=l.account_id
          WHERE l.org_id=? AND l.operation_id=? AND l.kind='payment' AND a.kind='payer'
          AND NOT EXISTS(SELECT 1 FROM crm_ledger r WHERE r.org_id=l.org_id AND r.reversal_of=l.id)`,
            [c.actor.org, b.originalPaymentId],
          )
        )[0];
        assert(
          original && original.account_id === b.payerId,
          409,
          "INVALID_PAYMENT",
          "Original active payment must belong to this payer",
        );
        const refunded = (
          await rows(
            c.db,
            `SELECT CAST(COALESCE(-SUM(l.amount),0) AS CHAR) n FROM crm_refunds f
          JOIN crm_ledger l ON l.org_id=f.org_id AND l.id=f.refund_entry_id
          WHERE f.org_id=? AND f.original_entry_id=? AND NOT EXISTS(SELECT 1 FROM crm_ledger r WHERE r.org_id=l.org_id AND r.reversal_of=l.id)`,
            [c.actor.org, original.id],
          )
        )[0]!.n;
        assert(
          BigInt(refunded) + BigInt(b.amount) <= BigInt(original.amount),
          409,
          "REFUND_EXCEEDED",
          "Refunds exceed original payment",
        );
      }
      const operation = randomUUID();
      const positive = ["payment", "income"].includes(b.kind);
      let target: string | undefined;
      if (["payment", "refund"].includes(b.kind)) {
        assert(
          b.payerId && !b.staffId,
          400,
          "PAYER_REQUIRED",
          "Specify payerId only",
        );
        await scoped(c.db, c.actor, "payers", b.payerId);
        target = b.payerId;
      } else if (b.kind === "salary_payment") {
        permit(c.actor, "director");
        assert(
          b.staffId && !b.payerId,
          400,
          "STAFF_REQUIRED",
          "Specify staffId only",
        );
        await get(c.db, c.actor, "staff", b.staffId);
        target = b.staffId;
      } else {
        permit(c.actor, "director");
        assert(
          !b.payerId && !b.staffId,
          400,
          "INVALID_TARGET",
          "No payer/staff for cash income or expense",
        );
      }
      const cashAmount = (
        positive ? BigInt(b.amount) : -BigInt(b.amount)
      ).toString();
      if (!positive) {
        const balance = (
          await rows(
            c.db,
            "SELECT CAST(COALESCE(SUM(amount),0) AS CHAR) AS n FROM crm_ledger WHERE org_id=? AND account_id=?",
            [c.actor.org, cash.id],
          )
        )[0]?.n;
        assert(
          BigInt(balance) >= BigInt(b.amount),
          409,
          "INSUFFICIENT_CASH",
          "Cash account cannot go below zero",
        );
      }
      if (b.kind === "salary_payment") {
        const accrued = (
          await rows(
            c.db,
            "SELECT CAST(COALESCE(SUM(amount),0) AS CHAR) AS n FROM crm_ledger WHERE org_id=? AND account_id=?",
            [c.actor.org, target],
          )
        )[0]?.n;
        assert(
          BigInt(accrued) >= BigInt(b.amount),
          409,
          "SALARY_EXCEEDED",
          "Payment exceeds accrued salary",
        );
      }
      const ids = [
        await entry(c, cash.id, cashAmount, b.kind, operation, b.reason),
      ];
      if (target)
        ids.push(
          await entry(c, target, cashAmount, b.kind, operation, b.reason),
        );
      if (original)
        await c.db.execute(
          "INSERT INTO crm_refunds(id,org_id,original_entry_id,refund_entry_id) VALUES(?,?,?,?)",
          [randomUUID(), c.actor.org, original.id, ids[1]],
        );
      return { operationId: operation, entryIds: ids };
    },
  );
  route(
    app,
    "post",
    "/transactions/:id/reverse",
    {
      idem: true,
      body: z.object({ reason: z.string().trim().min(1).max(1000) }).strict(),
      summary: "Reverse complete manual operation with compensation entries",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const entries = await rows(
        c.db,
        "SELECT * FROM crm_ledger WHERE org_id=? AND operation_id=?",
        [c.actor.org, c.req.params.id],
      );
      assert(entries.length, 404, "NOT_FOUND", "Operation not found");
      const operation = randomUUID();
      const ids = [];
      for (const e of entries) {
        const a = await scoped(c.db, c.actor, "accounts", e.account_id);
        if (a.kind === "payroll" || !["payment", "refund"].includes(e.kind))
          permit(c.actor, "director");
        if (a.kind === "payer" && e.kind === "payment")
          await checkLegacyRefunds(c, e.account_id);
      }
      const linkedRefunds = await rows(
        c.db,
        `SELECT f.id FROM crm_refunds f
        JOIN crm_ledger original ON original.org_id=f.org_id AND original.id=f.original_entry_id
        JOIN crm_ledger refund ON refund.org_id=f.org_id AND refund.id=f.refund_entry_id
        WHERE f.org_id=? AND original.operation_id=? AND NOT EXISTS(SELECT 1 FROM crm_ledger r WHERE r.org_id=refund.org_id AND r.reversal_of=refund.id)`,
        [c.actor.org, c.req.params.id],
      );
      assert(
        !linkedRefunds.length,
        409,
        "PAYMENT_HAS_REFUNDS",
        "Reverse linked refunds before correcting payment",
      );
      for (const e of entries) {
        assert(
          !e.lesson_id && !e.reversal_of,
          409,
          "USE_LESSON_CORRECTION",
          "Lesson entries/reversals cannot be manually reversed",
        );
        const a = await scoped(c.db, c.actor, "accounts", e.account_id);
        if (a.kind === "payroll" || !["payment", "refund"].includes(e.kind))
          permit(c.actor, "director");
        assert(
          !(
            await rows(
              c.db,
              "SELECT id FROM crm_ledger WHERE org_id=? AND reversal_of=?",
              [c.actor.org, e.id],
            )
          ).length,
          409,
          "ALREADY_REVERSED",
          "Operation already reversed",
        );
        if (a.kind === "cash") {
          const balance = (
            await rows(
              c.db,
              "SELECT CAST(COALESCE(SUM(amount),0) AS CHAR) AS n FROM crm_ledger WHERE org_id=? AND account_id=?",
              [c.actor.org, a.id],
            )
          )[0]?.n;
          assert(
            BigInt(balance) - BigInt(e.amount) >= 0n,
            409,
            "INSUFFICIENT_CASH",
            "Reversal would overdraw cash",
          );
        }
        ids.push(
          await entry(
            c,
            e.account_id,
            (-BigInt(e.amount)).toString(),
            "reversal",
            operation,
            b.reason,
            null,
            null,
            e.id,
          ),
        );
      }
      return { operationId: operation, entryIds: ids };
    },
  );
  route(
    app,
    "get",
    "/analytics",
    { summary: "Scoped totals: students, upcoming lessons and payer debt" },
    async (c) => {
      permit(c.actor, "director", "manager");
      const filter = has(c.actor, "director")
        ? ""
        : c.actor.branches.length
          ? ` AND branch_id IN(${c.actor.branches.map(() => "?").join(",")})`
          : " AND FALSE";
      const args = [c.actor.org, ...(filter ? c.actor.branches : [])];
      const students = (
        await rows(
          c.db,
          "SELECT COUNT(*) AS count FROM crm_students WHERE org_id=? AND active=TRUE" +
            filter,
          args,
        )
      )[0]?.count;
      const lessons = (
        await rows(
          c.db,
          "SELECT COUNT(*) AS count FROM crm_lessons WHERE org_id=? AND status='scheduled' AND starts_at>=UTC_TIMESTAMP(3)" +
            filter,
          args,
        )
      )[0]?.count;
      const debt = (
        await rows(
          c.db,
          `SELECT CAST(COALESCE(SUM(-b.balance),0) AS CHAR) AS total FROM (SELECT a.id,COALESCE(SUM(l.amount),0) AS balance FROM crm_accounts a LEFT JOIN crm_ledger l ON l.org_id=a.org_id AND l.account_id=a.id WHERE a.org_id=? AND a.kind='payer' ${filter.replaceAll("branch_id", "a.branch_id")} GROUP BY a.id HAVING balance<0) b`,
          args,
        )
      )[0]?.total;
      return {
        students: Number(students),
        upcomingLessons: Number(lessons),
        debt,
      };
    },
  );
}

// Fail closed for pre-007 refunds whose source payment cannot be inferred safely.
async function checkLegacyRefunds(c: Context, payerId: string) {
  const unlinked = await rows(
    c.db,
    `SELECT l.id FROM crm_ledger l WHERE l.org_id=? AND l.account_id=? AND l.kind='refund'
    AND NOT EXISTS(SELECT 1 FROM crm_refunds f WHERE f.org_id=l.org_id AND f.refund_entry_id=l.id)
    AND NOT EXISTS(SELECT 1 FROM crm_ledger r WHERE r.org_id=l.org_id AND r.reversal_of=l.id) LIMIT 1`,
    [c.actor.org, payerId],
  );
  assert(
    !unlinked.length,
    409,
    "LEGACY_REFUNDS_UNRESOLVED",
    "Reconcile unlinked legacy refunds before refunding or reversing payments",
  );
}
