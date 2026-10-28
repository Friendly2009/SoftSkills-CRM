import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, scoped, branch, has } from "../core/security.js";
import { assert } from "../core/errors.js";
import { id, money, instant, sqlTime, json } from "../core/validation.js";
import { visible, visibility } from "./resources.js";
import { entry } from "./finance.js";
const paging = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
};
export function financeReportRoutes(app: Express) {
  route(
    app,
    "post",
    "/transfers",
    {
      idem: true,
      summary:
        "Transfer money between cash/bank accounts without income or expense",
      body: z
        .object({
          fromAccountId: id,
          toAccountId: id,
          amount: money.refine((v) => BigInt(v) > 0n),
          reason: z.string().trim().min(1).max(1000),
        })
        .strict(),
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      assert(
        b.fromAccountId !== b.toAccountId,
        400,
        "SAME_ACCOUNT",
        "Choose different accounts",
      );
      const from = await scoped(c.db, c.actor, "accounts", b.fromAccountId);
      const to = await scoped(c.db, c.actor, "accounts", b.toAccountId);
      assert(
        from.kind === "cash" && to.kind === "cash",
        400,
        "INVALID_ACCOUNT",
        "Cash/bank accounts required",
      );
      const balance = (
        await rows(
          c.db,
          "SELECT CAST(COALESCE(SUM(amount),0) AS CHAR) n FROM crm_ledger WHERE org_id=? AND account_id=?",
          [c.actor.org, from.id],
        )
      )[0]!.n;
      assert(
        BigInt(balance) >= BigInt(b.amount),
        409,
        "INSUFFICIENT_CASH",
        "Insufficient cash",
      );
      const operationId = randomUUID();
      const entryIds = [
        await entry(
          c,
          from.id,
          (-BigInt(b.amount)).toString(),
          "transfer",
          operationId,
          b.reason,
        ),
        await entry(c, to.id, b.amount, "transfer", operationId, b.reason),
      ];
      return { operationId, entryIds };
    },
  );
  route(
    app,
    "get",
    "/accounts/:id/history",
    {
      summary: "Visible account history and balance, integer kopecks",
      query: z.object(paging).strict(),
    },
    async (c, _, q) => {
      const a = await visible(c, "accounts", String(c.req.params.id));
      const args = [c.actor.org, a.id];
      const totals = (
        await rows(
          c.db,
          "SELECT COUNT(*) total,CAST(COALESCE(SUM(amount),0) AS CHAR) balance FROM crm_ledger WHERE org_id=? AND account_id=?",
          args,
        )
      )[0]!;
      const items = await rows(
        c.db,
        `SELECT l.*, f.original_entry_id FROM crm_ledger l LEFT JOIN crm_refunds f ON f.org_id=l.org_id AND f.refund_entry_id=l.id WHERE l.org_id=? AND l.account_id=? ORDER BY l.created_at DESC,l.id DESC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        args,
      );
      return {
        accountId: a.id,
        balance: totals.balance,
        total: Number(totals.total),
        page: q.page,
        pageSize: q.pageSize,
        items,
      };
    },
  );
  route(
    app,
    "get",
    "/lessons/:id/versions",
    {
      summary: "Immutable lesson and roster snapshots, managers/directors only",
      query: z.object(paging).strict(),
    },
    async (c, _, q) => {
      permit(c.actor, "director", "manager");
      const l = await scoped(c.db, c.actor, "lessons", String(c.req.params.id));
      const items = await rows(
        c.db,
        `SELECT revision,snapshot FROM crm_lesson_versions WHERE org_id=? AND lesson_id=? ORDER BY revision DESC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        [c.actor.org, l.id],
      );
      return {
        items: items.map((v) => {
          const s = json(v.snapshot);
          if (!has(c.actor, "director")) delete s.lesson.salary;
          return { revision: v.revision, ...s };
        }),
        page: q.page,
        pageSize: q.pageSize,
      };
    },
  );
  route(
    app,
    "get",
    "/reports/finance",
    {
      summary:
        "Accrual result and separate cash flow, balances as of exclusive to",
      query: z
        .object({ from: instant, to: instant, branchId: id.optional() })
        .strict()
        .refine(
          (q) =>
            Date.parse(q.to) > Date.parse(q.from) &&
            Date.parse(q.to) - Date.parse(q.from) <= 366 * 86400000,
          "Period must be positive and <=366 days",
        ),
    },
    async (c, _, q) => {
      // Payroll and result are restricted together: managers cannot infer hidden salary.
      permit(c.actor, "director");
      if (q.branchId) branch(c.actor, q.branchId);
      const scope = visibility(c, "accounts");
      if (q.branchId) {
        scope.where.push("r.branch_id=?");
        scope.args.push(q.branchId);
      }
      const totals = await rows(
        c.db,
        `SELECT r.kind accountKind,COALESCE(o.kind,l.kind) kind,CAST(SUM(l.amount) AS CHAR) amount
      FROM crm_ledger l JOIN crm_accounts r ON r.org_id=l.org_id AND r.id=l.account_id
      LEFT JOIN crm_ledger o ON o.org_id=l.org_id AND o.id=l.reversal_of
      WHERE ${scope.where.join(" AND ")} AND l.created_at>=? AND l.created_at<? GROUP BY r.kind,COALESCE(o.kind,l.kind)`,
        [...scope.args, sqlTime(q.from), sqlTime(q.to)],
      );
      const sum = (account: string, kind: string) =>
        BigInt(
          totals.find((v) => v.accountKind === account && v.kind === kind)
            ?.amount ?? "0",
        );
      const payments = sum("cash", "payment"),
        refunds = -sum("cash", "refund"),
        expenses = -sum("cash", "expense"),
        otherIncome = sum("cash", "income");
      const tuition = -sum("payer", "lesson_charge"),
        salary = sum("payroll", "salary_accrual"),
        paid = -sum("cash", "salary_payment");
      const balances = await rows(
        c.db,
        `SELECT r.id,r.kind,r.name,CAST(COALESCE(SUM(l.amount),0) AS CHAR) balance FROM crm_accounts r LEFT JOIN crm_ledger l ON l.org_id=r.org_id AND l.account_id=r.id AND l.created_at<? WHERE ${scope.where.join(" AND ")} GROUP BY r.id,r.kind,r.name ORDER BY r.id`,
        [sqlTime(q.to), ...scope.args],
      );
      const payroll = await rows(
        c.db,
        `SELECT r.id staffId,CAST(COALESCE(SUM(IF(COALESCE(o.kind,l.kind)='salary_accrual',l.amount,0)),0) AS CHAR) accrued,CAST(COALESCE(-SUM(IF(COALESCE(o.kind,l.kind)='salary_payment',l.amount,0)),0) AS CHAR) paid FROM crm_accounts r LEFT JOIN crm_ledger l ON l.org_id=r.org_id AND l.account_id=r.id AND l.created_at>=? AND l.created_at<? LEFT JOIN crm_ledger o ON o.org_id=l.org_id AND o.id=l.reversal_of WHERE ${scope.where.join(" AND ")} AND r.kind='payroll' GROUP BY r.id`,
        [sqlTime(q.from), sqlTime(q.to), ...scope.args],
      );
      return {
        from: q.from,
        to: q.to,
        payments: String(payments),
        refunds: String(refunds),
        expenses: String(expenses),
        otherIncome: String(otherIncome),
        tuitionAccrued: String(tuition),
        salaryAccrued: String(salary),
        salaryPaid: String(paid),
        cashFlow: String(
          payments -
            refunds +
            otherIncome -
            expenses -
            paid +
            sum("cash", "transfer"),
        ),
        transfersNet: String(sum("cash", "transfer")),
        financialResult: String(tuition + otherIncome - expenses - salary),
        formula: "tuitionAccrued + otherIncome - expenses - salaryAccrued",
        cashBalances: balances.filter((v) => v.kind === "cash"),
        payerBalances: balances.filter((v) => v.kind === "payer"),
        payerDebts: balances
          .filter((v) => v.kind === "payer" && BigInt(v.balance) < 0n)
          .map((v) => ({ ...v, debt: String(-BigInt(v.balance)) })),
        payroll: payroll.map((v) => ({
          ...v,
          balance: balances.find((a) => a.id === v.staffId)?.balance ?? "0",
        })),
      };
    },
  );
}
