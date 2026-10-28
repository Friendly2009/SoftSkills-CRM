import { portalFields } from "./portalFields.js";
// Response contracts for the generated OpenAPI. SQL BIGINT is always a JSON string.
const string = { type: "string" };
const uuid = { type: "string", format: "uuid" };
const integer = { type: "integer" };
const boolean = { type: "boolean" };
const cash = {
  type: "string",
  pattern: "^-?[0-9]+$",
  description: "Exact integer kopecks",
};
const nullable = (s: any) => ({ ...s, type: [s.type, "null"] });
const field = (columns: string[], schema: any) =>
  Object.fromEntries(columns.map((k) => [k, schema]));
const common = { id: uuid, org_id: uuid };
export const recordSchemas: Record<string, any> = {
  enrollments: {
    branch_id: uuid,
    group_id: uuid,
    student_id: uuid,
    starts_at: string,
    ends_at: nullable(string),
  },
  "payer-students": {
    branch_id: uuid,
    payer_id: uuid,
    student_id: uuid,
    relationship: string,
  },
  branches: {
    name: string,
    address: string,
    active: { type: ["integer", "boolean"] },
  },
  people: {
    branch_id: uuid,
    name: string,
    birthday: nullable({ type: "string", format: "date" }),
    comment: string,
    active: { type: ["integer", "boolean"] },
  },
  payers: { person_id: uuid, branch_id: uuid, comment: string },
  students: {
    person_id: uuid,
    branch_id: uuid,
    payer_id: uuid,
    active: { type: ["integer", "boolean"] },
  },
  staff: {
    person_id: uuid,
    branch_id: uuid,
    name: string,
    subject: string,
    status: string,
    rate: cash,
  },
  users: {
    person_id: uuid,
    login: string,
    roles: { type: "array", items: string },
    branches: { type: "array", items: uuid },
    active: { type: ["integer", "boolean"] },
  },
  rooms: { branch_id: uuid, name: string, capacity: nullable(integer) },
  groups: {
    branch_id: uuid,
    teacher_id: uuid,
    name: string,
    subject: string,
    capacity: integer,
    status: string,
    start_date: nullable(string),
    end_date: nullable(string),
  },
  leads: {
    person_id: uuid,
    branch_id: uuid,
    name: string,
    source: string,
    comment: string,
    status: string,
    responsible_id: nullable(uuid),
    student_id: nullable(uuid),
    payer_id: nullable(uuid),
  },
  lessons: {
    branch_id: uuid,
    group_id: nullable(uuid),
    teacher_id: uuid,
    room_id: nullable(uuid),
    name: string,
    starts_at: string,
    ends_at: string,
    salary: cash,
    base_price: cash,
    timezone: string,
    subject: nullable(string),
    revision: integer,
    status: { type: "string", enum: ["scheduled", "completed", "cancelled"] },
    comment: string,
  },
  "subscription-templates": {
    branch_id: uuid,
    name: string,
    subject: string,
    lessons: integer,
    group_id: nullable(uuid),
    days: integer,
    price: cash,
    active: { type: ["integer", "boolean"] },
  },
  subscriptions: {
    branch_id: uuid,
    student_id: uuid,
    template_id: uuid,
    subject: nullable(string),
    group_id: nullable(uuid),
    starts_at: string,
    ends_at: string,
    allowance: integer,
    frozen_at: nullable(string),
  },
  accounts: {
    branch_id: uuid,
    person_id: nullable(uuid),
    name: string,
    kind: { type: "string", enum: ["payer", "cash", "payroll"] },
  },
  ledger: {
    account_id: uuid,
    amount: cash,
    kind: string,
    lesson_id: nullable(uuid),
    revision: nullable(integer),
    reversal_of: nullable(uuid),
    operation_id: uuid,
    reason: string,
    created_at: string,
  },
  tasks: {
    student_id: nullable(uuid),
    payer_id: nullable(uuid),
    branch_id: uuid,
    name: string,
    date: string,
    responsible_id: nullable(uuid),
    person_id: nullable(uuid),
    priority: string,
    status: string,
    comment: string,
  },
  companies: {
    branch_id: uuid,
    ...field(
      [
        "name",
        "inn",
        "kpp",
        "address",
        "contact",
        "phone",
        "account",
        "bank",
        "status",
      ],
      string,
    ),
  },
  dictionaries: {
    branch_id: uuid,
    name: string,
    category: string,
    value: { type: "object", additionalProperties: true },
    active: { type: ["integer", "boolean"] },
  },
  audit: {
    actor_id: uuid,
    action: string,
    resource: string,
    resource_id: string,
    request_id: uuid,
    details: { type: "object" },
    created_at: string,
  },
  announcements: {
    branch_id: uuid,
    name: string,
    description: string,
    active: { type: ["integer", "boolean"] },
    created_at: string,
  },
};
for (const [name, properties] of Object.entries(recordSchemas))
  recordSchemas[name] = {
    type: "object",
    required: ["id", "org_id"],
    properties: {
      ...common,
      ...properties,
      ...([
        "branches",
        "rooms",
        "people",
        "payers",
        "students",
        "staff",
        "companies",
        "tasks",
        "groups",
        "leads",
        "enrollments",
        "payer-students",
      ].includes(name)
        ? {
            version: { type: "integer", minimum: 1 },
            archived_at: nullable(string),
          }
        : {}),
    },
    additionalProperties: false,
  };
export function responseData(method: string, path: string): any {
  const object = (
    properties: Record<string, any>,
    required = Object.keys(properties),
  ) => ({ type: "object", properties, required, additionalProperties: false });
  const array = (items: any) => ({ type: "array", items });
  const importResult = object({ rows: array(object({ row: integer, personId: uuid, reused: boolean, roleId: uuid }, ["row","personId","reused"])) });
  if (path === "/imports/people/preview") return object({id:uuid,rowCount:integer,expiresInHours:integer,rows:array(object({row:integer,name:string,email:string,phone:string,birthday:string,comment:string},["row","name"]))});
  if (path === "/imports/people" || path === "/imports/:id/confirm") return importResult;
  if (path === "/people/:id/contacts") return array(object({kind:{enum:["email","phone"]},value:string}));
  if (path === "/lead-stages") return array(string);
  if (path === "/pipeline") return object({stages:array(object({status:string,total:integer}))});
  if (path === "/widgets") return object({ids:array({enum:["lessons","sales","finance","attendance"]})});
  if (path === "/notifications/read") return object({marked:integer});
  if (path === "/notifications") return object({items:array(object({id:uuid,message:string,read_at:nullable(string),created_at:string})),page:integer,pageSize:integer});
  if (path === "/analytics/overview") {
    const counts = array(object({status:string,count:integer}));
    return object({from:string,to:string,activeStudents:integer,lessons:counts,sales:counts,attendance:counts,finance:object({income:cash,expense:cash,net:cash,transfersNet:cash})});
  }
  if (method !== "get" && /^\/(users|announcements|subscription-templates|dictionaries|accounts)(\/:id)?$/.test(path)) return object({id:uuid});
  if (path === "/comments") return method === "post" ? object({id:uuid}) : object({items:array(object({id:uuid,author_id:uuid,text:string,created_at:string})),page:integer,pageSize:integer});
  if (path === "/auth/csrf") return object({ csrfToken: string });
  if (
    [
      "/auth/register",
      "/auth/login",
      "/auth/invitations/accept",
      "/auth/me",
    ].includes(path)
  )
    return object({
      id: uuid,
      org: uuid,
      personId: uuid,
      roles: { type: "array", items: string },
      branches: { type: "array", items: uuid },
      companySlug: string,
      csrfToken: string,
      ...(path === "/auth/register" ? { branchId: uuid } : {}),
    });
  if (path === "/invitations")
    return object({
      id: uuid,
      token: {
        type: "string",
        description:
          "Returned once; deliver privately. Never log or put in a URL query.",
      },
      expiresInHours: integer,
    });
  if (["/auth/logout", "/auth/sessions/revoke-others"].includes(path))
    return object({ revoked: boolean });
  if (path === "/profile/password")
    return object({ changed: boolean, signInRequired: boolean });
  if (path === "/profile")
    return method === "get"
      ? object({
          person: object({
            id: uuid,
            name: string,
            fullName: string,
            version: integer,
            birthday: nullable(string),
          }),
          contacts: {
            type: "array",
            items: object({
              kind: { enum: ["email", "phone"] },
              value: string,
            }),
          },
        })
      : object({ id: uuid, version: integer });
  const paginated = (item: any) =>
    object({
      items: { type: "array", items: item },
      page: integer,
      pageSize: integer,
      total: integer,
    });
  const comment = object(
    {
      id: uuid,
      author_id: uuid,
      author_name: string,
      text: string,
      created_at: string,
    },
    ["id", "author_id", "text", "created_at"],
  );
  if (path.endsWith("/history") && path !== "/accounts/:id/history")
    return paginated(
      object({
        id: uuid,
        org_id: uuid,
        resource: string,
        resource_id: uuid,
        author_id: uuid,
        author_name: string,
        action: string,
        before_data: { type: ["object", "null"] },
        after_data: { type: "object" },
        created_at: string,
      }),
    );
  if (path.endsWith("/comments"))
    return method === "get" ? paginated(comment) : comment;
  if (path.endsWith("/archive"))
    return object({ id: uuid, archived: boolean, version: integer });
  if (path === "/groups/:id/members" && method === "get")
    return paginated(recordSchemas.enrollments);
  if (path === "/leads/:id/convert")
    return object({
      leadId: uuid,
      payerId: uuid,
      studentId: nullable(uuid),
      version: integer,
    });
  if (path === "/organization")
    return method === "get"
      ? object({
          id: uuid,
          name: string,
          timezone: string,
          settings: { type: "object" },
          company_slug: string,
          created_at: string,
          version: integer,
          archived_at: nullable(string),
        })
      : object({ id: uuid, version: integer });
  const parts = path.split("/").filter(Boolean);
  const baseRecord = parts[0] ? recordSchemas[parts[0]] : undefined;
  const portalColumns = portalFields;
  const columns = portalColumns[parts[0] ?? ""]?.concat(
    baseRecord?.properties.version ? ["version", "archived_at"] : [],
  );
  const record =
    baseRecord && columns
      ? {
          anyOf: [
            baseRecord,
            object(
              Object.fromEntries(
                columns.map((k) => [k, baseRecord.properties[k] ?? string]),
              ),
              ["id"],
            ),
          ],
        }
      : baseRecord;
  if (method === "get" && record && parts.length === 1)
    return {
      type: "object",
      required: ["items", "page", "pageSize", "total"],
      properties: {
        items: { type: "array", items: record },
        page: integer,
        pageSize: integer,
        total: integer,
      },
    };
  if (method === "get" && record && parts.length === 2 && parts[1] === ":id")
    return record;
  if (
    method !== "get" &&
    [
      "people",
      "payers",
      "students",
      "staff",
      "branches",
      "rooms",
      "companies",
      "groups",
      "tasks",
      "leads",
      "enrollments",
      "payer-students",
    ].includes(parts[0]!)
  )
    return object(
      {
        id: uuid,
        version: integer,
        personId: uuid,
        reused: boolean,
        removed: boolean,
        groupVersion: integer,
      },
      ["id", "version"].filter((k) => !(method === "delete" && k === "id")),
    );
  if (path === "/reports/finance") {
    const balances = {
      type: "array",
      items: object(
        { id: uuid, kind: string, name: string, balance: cash, debt: cash },
        ["id", "kind", "name", "balance"],
      ),
    };
    return object(
      {
        from: string,
        to: string,
        ...field(
          [
            "payments",
            "refunds",
            "expenses",
            "otherIncome",
            "tuitionAccrued",
            "salaryAccrued",
            "salaryPaid",
            "cashFlow",
            "transfersNet",
            "financialResult",
          ],
          cash,
        ),
        formula: string,
        cashBalances: balances,
        payerBalances: balances,
        payerDebts: balances,
        payroll: {
          type: "array",
          items: object(
            { staffId: uuid, accrued: cash, paid: cash, balance: cash },
            ["staffId", "accrued", "paid", "balance"],
          ),
        },
      },
      [
        "from",
        "to",
        "financialResult",
        "formula",
        "cashBalances",
        "payerDebts",
        "payroll",
      ],
    );
  }
  if (path === "/accounts/:id/history")
    return object(
      {
        accountId: uuid,
        balance: cash,
        total: integer,
        page: integer,
        pageSize: integer,
        items: {
          type: "array",
          items: object(
            {
              id: uuid,
              org_id: uuid,
              account_id: uuid,
              amount: cash,
              kind: string,
              lesson_id: nullable(uuid),
              revision: nullable(integer),
              reversal_of: nullable(uuid),
              operation_id: uuid,
              reason: string,
              created_at: string,
              original_entry_id: nullable(uuid),
            },
            [
              "id",
              "account_id",
              "amount",
              "kind",
              "operation_id",
              "reason",
              "created_at",
            ],
          ),
        },
      },
      ["accountId", "balance", "total", "page", "pageSize", "items"],
    );
  if (path === "/lessons/:id/versions")
    return object(
      {
        page: integer,
        pageSize: integer,
        items: {
          type: "array",
          items: object(
            {
              revision: integer,
              lesson: {
                type: "object",
                description:
                  "Stored lesson fields; salary omitted for managers",
                additionalProperties: true,
              },
              attendees: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            ["revision", "lesson", "attendees"],
          ),
        },
      },
      ["page", "pageSize", "items"],
    );
  if (path.endsWith("/balance"))
    return {
      type: "object",
      required: ["accountId", "balance"],
      properties: { accountId: uuid, balance: cash },
    };
  if (path === "/license")
    return {
      type: "object",
      properties: {
        mode: { const: "free_beta" },
        billingEnabled: { const: false },
        limits: { type: "null" },
      },
    };
  if (path === "/analytics")
    return {
      type: "object",
      properties: { students: integer, upcomingLessons: integer, debt: cash },
    };
  if (
    path === "/transactions" ||
    path === "/transfers" ||
    path.endsWith("/reverse")
  )
    return {
      type: "object",
      properties: {
        operationId: uuid,
        entryIds: { type: "array", items: uuid },
      },
    };
  if (method === "get" && path === "/lessons/:id/attendance")
    return object(
      {
        items: {
          type: "array",
          items: object(
            {
              id: uuid,
              org_id: uuid,
              lesson_id: uuid,
              student_id: uuid,
              payer_id: uuid,
              subscription_id: nullable(uuid),
              price: cash,
              discount: cash,
              discount_percent: nullable(integer),
              attendance: {
                type: ["string", "null"],
                enum: ["present", "absent", "excused", null],
              },
            },
            ["id", "lesson_id", "student_id", "attendance"],
          ),
        },
        page: integer,
        pageSize: integer,
      },
      ["items", "page", "pageSize"],
    );
  if (method === "get" && path === "/subscriptions/:id/usage")
    return object(
      {
        items: {
          type: "array",
          items: object(
            {
              id: uuid,
              lesson_id: uuid,
              revision: integer,
              delta: { type: "integer", enum: [-1, 1] },
              created_at: string,
            },
            ["id", "lesson_id", "revision", "delta", "created_at"],
          ),
        },
        page: integer,
        pageSize: integer,
        total: integer,
      },
      ["items", "page", "pageSize", "total"],
    );
  if (method !== "get" && path.startsWith("/lessons"))
    return object({ id: uuid, revision: integer, operationId: uuid }, [
      "id",
      "revision",
    ]);
  if (method !== "get" && path.startsWith("/subscriptions"))
    return object({ id: uuid, endsAt: string, frozenAt: string }, ["id"]);
  if (path.endsWith("/availability"))
    return {
      type: "object",
      properties: {
        id: uuid,
        remaining: integer,
        available: integer,
        frozen: boolean,
        endsAt: string,
      },
    };
  throw new Error(`Missing response contract: ${method} ${path}`);
}
