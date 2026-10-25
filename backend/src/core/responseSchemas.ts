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
  payers: { person_id: uuid, branch_id: uuid },
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
  rooms: { branch_id: uuid, name: string, capacity: integer },
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
  },
  lessons: {
    branch_id: uuid,
    group_id: nullable(uuid),
    teacher_id: uuid,
    room_id: uuid,
    name: string,
    starts_at: string,
    ends_at: string,
    salary: cash,
    revision: integer,
    status: { type: "string", enum: ["scheduled", "completed", "cancelled"] },
    comment: string,
  },
  "subscription-templates": {
    branch_id: uuid,
    name: string,
    subject: string,
    lessons: integer,
    days: integer,
    price: cash,
    active: { type: ["integer", "boolean"] },
  },
  subscriptions: {
    branch_id: uuid,
    student_id: uuid,
    template_id: uuid,
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
    properties: { ...common, ...properties },
    additionalProperties: false,
  };
export function responseData(method: string, path: string): any {
  const parts = path.split("/").filter(Boolean);
  const record = parts[0] ? recordSchemas[parts[0]] : undefined;
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
  if (path === "/transactions" || path.endsWith("/reverse"))
    return {
      type: "object",
      properties: {
        operationId: uuid,
        entryIds: { type: "array", items: uuid },
      },
    };
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
  return {
    description:
      "Operation-specific data; see docs/API.md and executable integration scenarios. Sensitive fields are omitted according to role.",
  };
}
