import { portalFields } from "../core/portalFields.js";
export { portalFields } from "../core/portalFields.js";
import { recordTables } from "../core/records.js";
import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route, type Context } from "../core/api.js";
import { rows } from "../core/db.js";
import { has, permit, branch, get, scoped } from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  pageQuery,
  instant,
  id,
  text,
  money,
  phone,
} from "../core/validation.js";
export const resources: Record<
  string,
  {
    table: string;
    search?: string;
    status?: boolean;
    branch?: boolean;
    roles?: string[];
  }
> = {
  enrollments: { table: "members", branch: true },
  "payer-students": { table: "payer_students", branch: true },
  announcements: {
    table: "announcements",
    search: "name",
    branch: true,
    roles: ["director", "manager", "teacher"],
  },
  branches: {
    table: "branches",
    search: "name",
    roles: ["director", "manager", "teacher"],
    branch: false,
  },
  people: { table: "people", search: "name", branch: true },
  payers: { table: "payers", branch: true },
  students: { table: "students", branch: true },
  staff: {
    table: "staff",
    search: "name",
    status: true,
    branch: true,
    roles: ["director", "manager", "teacher"],
  },
  users: { table: "users", search: "login", roles: ["director"] },
  rooms: {
    table: "rooms",
    search: "name",
    branch: true,
    roles: ["director", "manager", "teacher"],
  },
  groups: { table: "groups", search: "name", status: true, branch: true },
  leads: {
    table: "leads",
    search: "name",
    status: true,
    branch: true,
    roles: ["director", "manager"],
  },
  lessons: { table: "lessons", search: "name", status: true, branch: true },
  "subscription-templates": {
    table: "subscription_templates",
    search: "name",
    branch: true,
    roles: ["director", "manager"],
  },
  subscriptions: { table: "subscriptions", branch: true },
  tasks: {
    table: "tasks",
    search: "name",
    status: true,
    branch: true,
    roles: ["director", "manager", "teacher"],
  },
  companies: {
    table: "companies",
    search: "name",
    status: true,
    branch: true,
    roles: ["director", "manager"],
  },
  dictionaries: {
    table: "dictionaries",
    search: "name",
    branch: true,
    roles: ["director", "manager"],
  },
  accounts: { table: "accounts", search: "name", branch: true },
  ledger: { table: "ledger" },
  audit: { table: "audit", roles: ["director"] },
};
function studentVisibility(c: Context, alias: string, args: unknown[]): string {
  if (has(c.actor, "teacher")) {
    args.push(c.actor.personId, c.actor.personId);
    return `(${alias}.id IN(SELECT m.student_id FROM crm_members m JOIN crm_groups g ON g.org_id=m.org_id AND g.id=m.group_id JOIN crm_staff t ON t.org_id=g.org_id AND t.id=g.teacher_id WHERE m.org_id=r.org_id AND t.person_id=?) OR ${alias}.id IN(SELECT x.student_id FROM crm_attendees x JOIN crm_lessons l ON l.org_id=x.org_id AND l.id=x.lesson_id JOIN crm_staff t ON t.org_id=l.org_id AND t.id=l.teacher_id WHERE x.org_id=r.org_id AND t.person_id=?))`;
  }
  const clauses: string[] = [];
  if (has(c.actor, "student")) {
    clauses.push(`${alias}.person_id=?`);
    args.push(c.actor.personId);
  }
  if (has(c.actor, "payer")) {
    clauses.push(
      `${alias}.id IN(SELECT ps.student_id FROM crm_payer_students ps JOIN crm_payers p ON p.org_id=ps.org_id AND p.id=ps.payer_id WHERE ps.org_id=r.org_id AND p.person_id=? AND ps.archived_at IS NULL AND p.archived_at IS NULL)`,
    );
    args.push(c.actor.personId);
  }
  return "(" + (clauses.join(" OR ") || "FALSE") + ")";
}
function visibilityBase(c: Context, name: string) {
  const def = resources[name];
  assert(def, 404, "NOT_FOUND", "Unknown resource");
  if (def.roles) permit(c.actor, ...def.roles);
  const where = ["r.org_id=?"];
  const args: unknown[] = [c.actor.org];
  const staff = has(c.actor, "director", "manager");
  if (
    !has(c.actor, "director") &&
    has(c.actor, "manager", "teacher") &&
    !c.actor.branches.length
  )
    where.push("FALSE");
  if (
    !has(c.actor, "director") &&
    has(c.actor, "manager", "teacher") &&
    c.actor.branches.length
  ) {
    if (def.branch) {
      where.push(
        `r.branch_id IN (${c.actor.branches.map(() => "?").join(",")})`,
      );
      args.push(...c.actor.branches);
    }
    if (name === "branches") {
      where.push(`r.id IN (${c.actor.branches.map(() => "?").join(",")})`);
      args.push(...c.actor.branches);
    }
    if (name === "ledger") {
      where.push(
        `r.account_id IN(SELECT a.id FROM crm_accounts a WHERE a.org_id=r.org_id AND a.branch_id IN(${c.actor.branches.map(() => "?").join(",")}))`,
      );
      args.push(...c.actor.branches);
    }
  }
  if (staff) {
    if (name === "accounts" && !has(c.actor, "director"))
      where.push("r.kind<>'payroll'");
    if (name === "ledger" && !has(c.actor, "director"))
      where.push(
        "r.account_id IN(SELECT a.id FROM crm_accounts a WHERE a.org_id=r.org_id AND a.kind<>'payroll')",
      );
    return { where, args };
  }
  switch (name) {
    case "announcements":
      where.push("r.active=TRUE");
      break;
    case "branches":
    case "rooms":
      break;
    case "staff":
      where.push("r.person_id=?");
      args.push(c.actor.personId);
      break;
    case "groups":
      if (has(c.actor, "teacher")) {
        where.push(
          "r.teacher_id IN(SELECT t.id FROM crm_staff t WHERE t.org_id=r.org_id AND t.person_id=?)",
        );
        args.push(c.actor.personId);
      } else {
        where.push(
          "r.id IN(SELECT m.group_id FROM crm_members m JOIN crm_students s ON s.org_id=m.org_id AND s.id=m.student_id WHERE m.org_id=r.org_id AND " +
            studentVisibility(c, "s", args) +
            ")",
        );
      }
      break;
    case "enrollments":
      where.push(
        `r.student_id IN(SELECT s.id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)})`,
      );
      break;
    case "payer-students":
      permit(c.actor, "payer", "student");
      where.push(
        `r.student_id IN(SELECT s.id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)})`,
      );
      break;
    case "students":
      where.push(studentVisibility(c, "r", args));
      break;
    case "people": {
      const own = "r.id=?";
      args.push(c.actor.personId);
      where.push(
        `(${own} OR r.id IN(SELECT s.person_id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)}))`,
      );
      break;
    }
    case "payers":
      permit(c.actor, "payer");
      where.push("r.person_id=?");
      args.push(c.actor.personId);
      break;
    case "lessons":
      if (has(c.actor, "teacher")) {
        where.push(
          "r.teacher_id IN(SELECT t.id FROM crm_staff t WHERE t.org_id=r.org_id AND t.person_id=?)",
        );
        args.push(c.actor.personId);
      } else
        where.push(
          `r.id IN(SELECT x.lesson_id FROM crm_attendees x JOIN crm_students s ON s.org_id=x.org_id AND s.id=x.student_id WHERE x.org_id=r.org_id AND ${studentVisibility(c, "s", args)})`,
        );
      break;
    case "subscriptions":
      where.push(
        `r.student_id IN(SELECT s.id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)})`,
      );
      break;
    case "tasks":
      where.push(
        "r.responsible_id IN(SELECT t.id FROM crm_staff t WHERE t.org_id=r.org_id AND t.person_id=?)",
      );
      args.push(c.actor.personId);
      where.push("r.payer_id IS NULL");
      where.push(
        `(r.student_id IS NULL OR r.student_id IN(SELECT s.id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)}))`,
      );
      where.push(
        `(r.person_id IS NULL OR r.person_id IN(SELECT s.person_id FROM crm_students s WHERE s.org_id=r.org_id AND ${studentVisibility(c, "s", args)}) OR r.person_id=?)`,
      );
      args.push(c.actor.personId);
      break;
    case "accounts":
      permit(c.actor, "payer");
      where.push("r.kind='payer' AND r.person_id=?");
      args.push(c.actor.personId);
      break;
    case "ledger":
      permit(c.actor, "payer");
      where.push(
        "r.account_id IN(SELECT a.id FROM crm_accounts a WHERE a.org_id=r.org_id AND a.kind='payer' AND a.person_id=?)",
      );
      args.push(c.actor.personId);
      break;
    default:
      permit(c.actor, "director", "manager");
  }
  return { where, args };
}
export function visibility(c: Context, name: string) {
  const staffRoles = c.actor.roles.filter((r) =>
    ["director", "manager", "teacher"].includes(r),
  );
  const personalRoles = c.actor.roles.filter((r) =>
    ["payer", "student"].includes(r),
  );
  const portalResources = [
    "people",
    "enrollments",
    "payer-students",
    "payers",
    "students",
    "groups",
    "lessons",
    "subscriptions",
    "accounts",
    "ledger",
  ];
  if (
    staffRoles.length &&
    personalRoles.length &&
    portalResources.includes(name) &&
    !has(c.actor, "director")
  ) {
    const personal = visibilityBase(
      { ...c, actor: { ...c.actor, roles: personalRoles, branches: [] } },
      name,
    );
    // Teachers do not get staff-wide payer/financial access, but retain their own payer role.
    if (
      staffRoles.length === 1 &&
      staffRoles[0] === "teacher" &&
      ["payers", "accounts", "ledger"].includes(name)
    )
      return personal;
    const staff = visibilityBase(
      { ...c, actor: { ...c.actor, roles: staffRoles } },
      name,
    );
    return {
      where: [
        `((${staff.where.join(" AND ")}) OR (${personal.where.join(" AND ")}))`,
      ],
      args: [...staff.args, ...personal.args],
    };
  }
  return visibilityBase(c, name);
}
export async function visible(c: Context, name: string, id: string) {
  const { where, args } = visibility(c, name);
  where.push("r.id=?");
  args.push(id);
  const row = (
    await rows(
      c.db,
      `SELECT r.* FROM crm_${resources[name]!.table} r WHERE ${where.join(" AND ")}`,
      args,
    )
  )[0];
  assert(row, 404, "NOT_FOUND", "Resource not found");
  return row;
}
export function redact(c: Context, name: string, row: any) {
  // Public portal DTOs are allowlists: newly added database fields never leak by default.
  if (!has(c.actor, "director", "manager", "teacher"))
    return portalDTO(name, row);
  const value = { ...row };
  delete value.password_hash;
  if (name === "staff" && !has(c.actor, "director")) delete value.rate;
  if (name === "lessons" && !has(c.actor, "director")) delete value.salary;
  if (name === "people" && !has(c.actor, "director", "manager"))
    delete value.comment;
  return value;
}
export function resourceRoutes(app: Express) {
  for (const [name, def] of Object.entries(resources)) {
    route(
      app,
      "get",
      "/" + name,
      {
        query:
          name === "lessons"
            ? pageQuery.extend({ from: instant, to: instant })
            : pageQuery,
        summary:
          name === "lessons"
            ? "Schedule overlapping [from,to), maximum 93 days, scoped and paginated"
            : `List ${name}, scoped and paginated`,
      },
      async (c, _, q) => {
        const { where, args } = visibility(c, name);
        if (q.q) {
          const search = def.search
            ? `r.${def.search}`
            : ["payers", "students"].includes(name)
              ? "(SELECT p.name FROM crm_people p WHERE p.org_id=r.org_id AND p.id=r.person_id)"
              : ["enrollments", "payer-students"].includes(name)
                ? "(SELECT p.name FROM crm_students s JOIN crm_people p ON p.org_id=s.org_id AND p.id=s.person_id WHERE s.org_id=r.org_id AND s.id=r.student_id)"
                : undefined;
          assert(search, 400, "FILTER_UNSUPPORTED", "Search unsupported");
          where.push(`${search} LIKE ? ESCAPE '='`);
          args.push("%" + q.q.replace(/[=%_]/g, (v: string) => "=" + v) + "%");
        }
        if (q.branchId) {
          assert(
            def.branch || name === "branches",
            400,
            "FILTER_UNSUPPORTED",
            "Branch filter unsupported",
          );
          where.push(name === "branches" ? "r.id=?" : "r.branch_id=?");
          args.push(q.branchId);
        }
        if (recordTables[name]) {
          if (q.archived !== "all" && q.status !== "archived")
            where.push(
              `r.archived_at IS ${q.archived === "only" ? "NOT " : ""}NULL`,
            );
        } else
          assert(
            q.archived === "exclude",
            400,
            "FILTER_UNSUPPORTED",
            "Archive filter unsupported",
          );
        if (q.status) {
          if (
            name === "enrollments" &&
            ["active", "ended", "future"].includes(q.status)
          ) {
            where.push(
              q.status === "active"
                ? "r.starts_at<=UTC_TIMESTAMP(3) AND (r.ends_at IS NULL OR r.ends_at>UTC_TIMESTAMP(3))"
                : q.status === "future"
                  ? "r.starts_at>UTC_TIMESTAMP(3)"
                  : "r.ends_at<=UTC_TIMESTAMP(3)",
            );
          } else if (def.status) {
            where.push("r.status=?");
            args.push(q.status);
          } else if (["branches", "people", "students"].includes(name)) {
            assert(
              ["active", "inactive"].includes(q.status),
              400,
              "INVALID_STATUS",
              "Use active or inactive",
            );
            where.push("r.active=?");
            args.push(q.status === "active");
          } else {
            assert(
              recordTables[name] && ["active", "archived"].includes(q.status),
              400,
              "FILTER_UNSUPPORTED",
              "Use active or archived",
            );
            where.push(
              `r.archived_at IS ${q.status === "archived" ? "NOT " : ""}NULL`,
            );
          }
        }
        const filters: Record<string, string[]> = {
          personId: ["payers", "students", "staff", "leads", "tasks"],
          payerId: ["students", "payer-students", "tasks", "leads"],
          studentId: [
            "enrollments",
            "payer-students",
            "tasks",
            "leads",
            "lessons",
            "subscriptions",
          ],
          roomId: ["lessons"],
          groupId: ["enrollments", "lessons"],
          responsibleId: ["tasks", "leads"],
          teacherId: ["groups", "lessons"],
          priority: ["tasks"],
        };
        for (const [field, allowed] of Object.entries(filters))
          if (q[field]) {
            assert(
              allowed.includes(name),
              400,
              "FILTER_UNSUPPORTED",
              `Unsupported filter: ${field}`,
            );
            if (field === "studentId" && name === "lessons") {
              where.push(
                "EXISTS(SELECT 1 FROM crm_attendees a WHERE a.org_id=r.org_id AND a.lesson_id=r.id AND a.student_id=?)",
              );
              args.push(q[field]);
              continue;
            }
            where.push(
              `r.${field.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())}=?`,
            );
            args.push(q[field]);
          }
        const sort = [
          "id",
          ...(def.search
            ? [def.search]
            : ["payers", "students", "enrollments", "payer-students"].includes(
                  name,
                )
              ? ["name"]
              : []),
          ...(def.status ? ["status"] : []),
          ...(recordTables[name] ? ["version"] : []),
          ...(["groups", "rooms"].includes(name) ? ["capacity"] : []),
          ...(name === "tasks" ? ["date", "priority"] : []),
          ...(["audit", "ledger", "announcements"].includes(name)
            ? ["created_at"]
            : []),
          ...(["lessons", "enrollments"].includes(name)
            ? ["starts_at", "ends_at"]
            : []),
        ];
        assert(
          sort.includes(q.sortBy),
          400,
          "SORT_UNSUPPORTED",
          "Unsupported sort field for resource",
        );
        if (name === "lessons") {
          assert(
            q.from &&
              q.to &&
              Date.parse(q.to) > Date.parse(q.from) &&
              Date.parse(q.to) - Date.parse(q.from) <= 93 * 86400000,
            400,
            "SCHEDULE_PERIOD",
            "Provide from/to, with a positive period of at most 93 days",
          );
        }
        for (const key of ["from", "to"])
          if (q[key]) {
            assert(
              ["lessons", "ledger", "audit"].includes(name),
              400,
              "FILTER_UNSUPPORTED",
              "Time filter unsupported",
            );
            where.push(
              `r.${name === "lessons" ? (key === "from" ? "ends_at" : "starts_at") : "created_at"} ${key === "from" ? (name === "lessons" ? ">" : ">=") : "<"} ?`,
            );
            args.push(
              new Date(q[key]).toISOString().slice(0, 23).replace("T", " "),
            );
          }
        const sortExpression =
          q.sortBy === "name" && !def.search
            ? ["payers", "students"].includes(name)
              ? "(SELECT p.name FROM crm_people p WHERE p.org_id=r.org_id AND p.id=r.person_id)"
              : "(SELECT p.name FROM crm_students s JOIN crm_people p ON p.org_id=s.org_id AND p.id=s.person_id WHERE s.org_id=r.org_id AND s.id=r.student_id)"
            : `r.${q.sortBy}`;
        const filter = where.join(" AND ");
        const count = (
          await rows(
            c.db,
            `SELECT COUNT(*) AS total FROM crm_${def.table} r WHERE ${filter}`,
            args,
          )
        )[0];
        const items = await rows(
          c.db,
          `SELECT r.* FROM crm_${def.table} r WHERE ${filter} ORDER BY ${sortExpression} ${q.sortOrder},r.id ${q.sortOrder} LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
          args,
        );
        return {
          items: items.map((r) => redact(c, name, r)),
          page: q.page,
          pageSize: q.pageSize,
          total: Number(count?.total),
        };
      },
    );
    route(
      app,
      "get",
      "/" + name + "/:id",
      { summary: `Read scoped ${name} record` },
      async (c) =>
        redact(c, name, await visible(c, name, String(c.req.params.id))),
    );
  }
  route(
    app,
    "get",
    "/people/:id/contacts",
    { summary: "Read contacts for an authorized person" },
    async (c) => {
      await visible(c, "people", String(c.req.params.id));
      return rows(
        c.db,
        "SELECT kind,value FROM crm_contacts WHERE org_id=? AND person_id=?",
        [c.actor.org, c.req.params.id],
      );
    },
  );
  route(
    app,
    "get",
    "/groups/:id/members",
    {
      query: pageQuery.pick({ page: true, pageSize: true }),
      summary: "List visible membership periods, including history",
    },
    async (c, _, q) => {
      await visible(c, "groups", String(c.req.params.id));
      const { where, args } = visibility(c, "students");
      where.push("x.group_id=?");
      args.push(c.req.params.id);
      const filter = where.join(" AND ");
      const count = (
        await rows(
          c.db,
          `SELECT COUNT(*) n FROM crm_members x JOIN crm_students r ON r.org_id=x.org_id AND r.id=x.student_id WHERE ${filter}`,
          args,
        )
      )[0]!;
      const list = await rows(
        c.db,
        `SELECT x.* FROM crm_members x JOIN crm_students r ON r.org_id=x.org_id AND r.id=x.student_id WHERE ${filter} ORDER BY x.starts_at DESC,x.id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        args,
      );
      return {
        items: list.map((v) => redact(c, "enrollments", v)),
        page: q.page,
        pageSize: q.pageSize,
        total: Number(count.n),
      };
    },
  );
  route(
    app,
    "get",
    "/lessons/:id/attendance",
    {
      query: pageQuery,
      summary: "Read visible attendance and assigned prices",
    },
    async (c, _, q) => {
      await visible(c, "lessons", String(c.req.params.id));
      const { where, args } = visibility(c, "students");
      where.push("x.lesson_id=?");
      args.push(c.req.params.id);
      const list = await rows(
        c.db,
        `SELECT x.* FROM crm_attendees x JOIN crm_students r ON r.org_id=x.org_id AND r.id=x.student_id WHERE ${where.join(" AND ")} ORDER BY x.id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
        args,
      );
      const ownPayer = (
        await rows(
          c.db,
          "SELECT id FROM crm_payers WHERE org_id=? AND person_id=?",
          [c.actor.org, c.actor.personId],
        )
      )[0]?.id;
      return {
        items: list.map((v) => {
          if (
            !has(c.actor, "director", "manager") &&
            !(has(c.actor, "payer") && v.payer_id === ownPayer)
          ) {
            delete v.price;
            delete v.discount;
            delete v.discount_percent;
            delete v.payer_id;
          }
          return !has(c.actor, "director", "manager", "teacher")
            ? portalDTO("attendance", v)
            : v;
        }),
        page: q.page,
        pageSize: q.pageSize,
      };
    },
  );
  const branchSchema = z
    .object({
      name: text,
      address: z.string().max(255).default(""),
      active: z.boolean().default(true),
    })
    .strict();
  const roomSchema = z
    .object({
      branchId: id,
      name: text,
      capacity: z.number().int().min(1).max(10000).nullable(),
    })
    .strict();
  simple(
    app,
    "branches",
    branchSchema,
    ["director"],
    { address: "address", active: "active" },
    false,
  );
  simple(app, "rooms", roomSchema, ["director"], {
    branchId: "branch_id",
    capacity: "capacity",
  });
  simple(
    app,
    "subscription-templates",
    z
      .object({
        branchId: id,
        name: text,
        subject: text,
        groupId: id.nullable().default(null),
        lessons: z.number().int().min(1).max(10000),
        days: z.number().int().min(1).max(3650),
        price: money,
        active: z.boolean().default(true),
      })
      .strict(),
    ["director"],
    {
      branchId: "branch_id",
      subject: "subject",
      groupId: "group_id",
      lessons: "lessons",
      days: "days",
      price: "price",
      active: "active",
    },
  );
  simple(
    app,
    "companies",
    z
      .object({
        branchId: id,
        name: text,
        inn: z.string().regex(/^(\d{10}|\d{12})$/),
        kpp: z
          .string()
          .regex(/^(\d{9})?$/)
          .default(""),
        address: z.string().max(255).default(""),
        contact: z.string().max(255).default(""),
        phone: z.union([z.literal(""), phone]).default(""),
        account: z.string().max(40).default(""),
        bank: z.string().max(255).default(""),
        status: z.enum(["Активна", "Архив"]).default("Активна"),
      })
      .strict(),
    ["director", "manager"],
    Object.fromEntries(
      [
        "inn",
        "kpp",
        "address",
        "contact",
        "phone",
        "account",
        "bank",
        "status",
      ].map((k) => [k, k]),
    ).valueOf() as any,
  );
  simple(
    app,
    "dictionaries",
    z
      .object({
        branchId: id,
        name: text,
        category: z.enum([
          "sources",
          "client-statuses",
          "client-fields",
          "tags",
          "refusal-reasons",
          "subjects",
          "lesson-types",
          "absence-reasons",
          "finance-categories",
          "payment-methods",
          "document-templates",
          "notification-templates",
        ]),
        value: z
          .record(
            z.string(),
            z.union([z.string().max(4000), z.number().finite(), z.boolean()]),
          )
          .default({}),
        active: z.boolean().default(true),
      })
      .strict(),
    ["director"],
    {
      branchId: "branch_id",
      category: "category",
      value: "value",
      active: "active",
    },
  );
  route(
    app,
    "get",
    "/organization",
    { summary: "Read organization settings" },
    async (c) => {
      permit(c.actor, "director", "manager");
      return (
        await rows(c.db, "SELECT * FROM crm_organizations WHERE id=?", [
          c.actor.org,
        ])
      )[0];
    },
  );
  route(
    app,
    "patch",
    "/organization",
    {
      body: z
        .object({
          name: text,
          timezone: z
            .string()
            .max(80)
            .refine((v) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: v });
                return true;
              } catch {
                return false;
              }
            }, "Invalid IANA timezone"),
          settings: z
            .object({
              address: z.string().max(255).optional(),
              calendarStart: z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                .optional(),
              calendarEnd: z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                .optional(),
              weekends: z.boolean().optional(),
              currency: z.literal("RUB").optional(),
            })
            .strict(),
        })
        .strict(),
      summary: "Director updates organization settings",
    },
    async (c, b) => {
      permit(c.actor, "director");
      await c.db.execute(
        "UPDATE crm_organizations SET name=?,timezone=?,settings=? WHERE id=?",
        [b.name, b.timezone, JSON.stringify(b.settings), c.actor.org],
      );
      return { id: c.actor.org };
    },
  );
  route(
    app,
    "get",
    "/license",
    { summary: "Free beta, unlimited branches/students/groups/staff" },
    async () => ({ mode: "free_beta", billingEnabled: false, limits: null }),
  );
}
function simple(
  app: Express,
  name: string,
  schema: z.ZodObject<any>,
  allowed: string[],
  mapping: Record<string, string>,
  withBranch = true,
) {
  const table = resources[name]!.table;
  const map = {
    name: "name",
    ...(withBranch ? { branchId: "branch_id" } : {}),
    ...mapping,
  };
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/" + name + (method === "patch" ? "/:id" : ""),
      {
        body: schema,
        summary: `${method === "post" ? "Create" : "Replace editable fields of"} ${name}`,
      },
      async (c, b) => {
        permit(c.actor, ...allowed);
        if (method === "patch")
          await scoped(c.db, c.actor, table, String(c.req.params.id));
        if (withBranch) {
          branch(c.actor, b.branchId);
          await get(c.db, c.actor, "branches", b.branchId);
          if (method === "patch") {
            const old = await get(
              c.db,
              c.actor,
              table,
              String(c.req.params.id),
            );
            assert(
              old.branch_id === b.branchId,
              409,
              "BRANCH_IMMUTABLE",
              "Create a new record to move branches",
            );
          }
        }
        if (name === "subscription-templates" && b.groupId) {
          const g = await scoped(c.db, c.actor, "groups", b.groupId);
          assert(
            g.branch_id === b.branchId &&
              !g.archived_at &&
              g.status !== "Архив" &&
              g.subject === b.subject,
            409,
            "TEMPLATE_GROUP",
            "Template group must be active in the same branch and subject",
          );
        }
        if (name === "rooms" && method === "patch" && b.capacity !== null) {
          const planned = await rows(
            c.db,
            "SELECT l.id FROM crm_lessons l JOIN crm_attendees a ON a.org_id=l.org_id AND a.lesson_id=l.id WHERE l.org_id=? AND l.room_id=? AND l.status='scheduled' GROUP BY l.id HAVING COUNT(*)>? LIMIT 1",
            [c.actor.org, c.req.params.id, b.capacity],
          );
          assert(
            !planned.length,
            409,
            "ROOM_CAPACITY",
            "Capacity lower than a scheduled lesson roster",
          );
        }
        const entityId =
          method === "post" ? randomUUID() : String(c.req.params.id);
        const entries = Object.entries(map).filter(([k]) => b[k] !== undefined);
        const values = entries.map(([k]) =>
          k === "value" ? JSON.stringify(b[k]) : b[k],
        );
        if (method === "post")
          await c.db.execute(
            `INSERT INTO crm_${table}(id,org_id,${entries.map(([, v]) => v).join(",")}) VALUES(?,?,${values.map(() => "?").join(",")})`,
            [entityId, c.actor.org, ...values],
          );
        else
          await c.db.execute(
            `UPDATE crm_${table} SET ${entries.map(([, v]) => v + "=?").join(",")} WHERE org_id=? AND id=?`,
            [...values, c.actor.org, entityId],
          );
        return { id: entityId };
      },
    );
}

export function portalDTO(name: string, row: Record<string, unknown>) {
  return Object.fromEntries(
    [
      ...(portalFields[name] ?? []),
      ...(recordTables[name] ? ["version", "archived_at"] : []),
    ]
      .filter((k) => k in row)
      .map((k) => [k, row[k]]),
  );
}
