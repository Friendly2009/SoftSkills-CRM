import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
if (!process.env.DB_NAME?.endsWith("_test"))
  throw new Error(
    "Use a dedicated DB_NAME ending in _test; test suite never resets a database",
  );
process.env.SESSION_SECRET = "integration-tests-only-32-characters-secret";
process.env.APP_ORIGIN = "http://localhost:5173";
process.env.NODE_ENV = "test";
process.env.COOKIE_SECURE = "false";
const { createApp } = await import("../../src/app.js");
const { pool } = await import("../../src/core/db.js");
let server: any, base: string, companySlug: string;
type Session = { cookie: string; csrf: string };
let director: Session,
  teacher: Session,
  manager: Session,
  payer: Session,
  student: Session,
  other: Session;
let originalPaymentId: string;
let branchId: string,
  secondBranch: string,
  personId: string,
  payerId: string,
  studentId: string,
  teacherId: string,
  teacherPerson: string,
  roomId: string,
  groupId: string,
  cashId: string,
  lessonId: string,
  subId: string,
  secondStudent: string;
const suffix = randomUUID().slice(0, 8);
const pass = "Test-password-strong-123";
async function request(
  method: string,
  path: string,
  body?: any,
  session?: Session,
  key?: string,
) {
  if (path === "/auth/login") body = { companySlug, ...body };
  if (["/auth/register", "/auth/login"].includes(path)) {
    const boot = await fetch(base + "/api/v1/auth/csrf");
    session = {
      cookie: boot.headers.get("set-cookie")!.split(";")[0]!,
      csrf: (await boot.json()).data.csrfToken,
    };
  }
  const versionHeaders: Record<string, string> = {};
  const { needsVersion } = await import("../../src/core/records.js");
  if (session && needsVersion(method.toLowerCase(), path)) {
    const target =
      path === "/profile" || path === "/organization"
        ? path
        : "/" + path.split("/").slice(1, 3).join("/");
    const current = await request("GET", target, undefined, session);
    if (current.status === 200)
      versionHeaders["If-Match"] = JSON.stringify(
        String(current.data.version ?? current.data.person?.version),
      );
  }
  if (method === "POST" && /\/groups\/[^/]+\/members$/.test(path))
    body = { startsAt: "2025-01-01T00:00:00Z", ...body };
  const res = await fetch(base + "/api/v1" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...versionHeaders,
      ...(session
        ? { Cookie: session.cookie, "X-CSRF-Token": session.csrf }
        : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json();
  if (res.status === 200) (await import("../contracts.js")).checkResponse(method,path,payload);
  return {
    status: res.status,
    data: payload.data,
    error: payload.error,
    requestId: payload.requestId,
    cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "",
  };
}
async function ok(
  method: string,
  path: string,
  body?: any,
  session = director,
  key?: string,
) {
  const r = await request(method, path, body, session, key);
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
}
async function person(name: string, br = branchId) {
  return (await ok("POST", "/people", { branchId: br, name, contacts: [] })).id;
}
async function user(personId: string, role: string, branches: string[] = []) {
  const login = role + "-" + randomUUID().slice(0, 12);
  await ok("POST", "/users", {
    personId,
    login,
    password: pass,
    roles: [role],
    branchIds: branches.length ? branches : [branchId],
  });
  const loginRes = await request("POST", "/auth/login", {
    login,
    password: pass,
  });
  assert.equal(loginRes.status, 200);
  return { cookie: loginRes.cookie, csrf: loginRes.data.csrfToken };
}
function lesson(overrides: any = {}) {
  return {
    branchId,
    name: "Test lesson",
    subject: "Math",
    teacherId,
    roomId,
    groupId: null,
    startsAt: "2026-01-10T10:00:00Z",
    endsAt: "2026-01-10T11:00:00Z",
    attendees: [
      { studentId, price: "10000", discount: "1000", subscriptionId: subId },
    ],
    ...overrides,
  };
}
before(async () => {
  await pool.execute("DELETE FROM crm_auth_limits");
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
  const reg = await request("POST", "/auth/register", {
    companyName: "Center " + suffix,
    fullName: "Director",
    login: "director-" + suffix,
    email: "owner-" + suffix + "@example.com",
    password: pass,
  });
  assert.equal(reg.status, 200, JSON.stringify(reg));
  director = { cookie: reg.cookie, csrf: reg.data.csrfToken };
  branchId = reg.data.branchId;
  companySlug = reg.data.companySlug;
  const reg2 = await request("POST", "/auth/register", {
    companyName: "Other " + suffix,
    fullName: "Other",
    login: "other-" + suffix,
    email: "other-" + suffix + "@example.com",
    password: pass,
  });
  assert.equal(reg2.status, 200);
  other = { cookie: reg2.cookie, csrf: reg2.data.csrfToken };
  secondBranch = (await ok("POST", "/branches", { name: "Second" })).id;
  personId = await person("Parent");
  payerId = (await ok("POST", "/payers", { personId })).id;
  const child = await person("Child without contacts");
  studentId = (await ok("POST", "/students", { personId: child, payerId })).id;
  const child2 = await person("Second child");
  secondStudent = (await ok("POST", "/students", { personId: child2, payerId }))
    .id;
  teacherPerson = await person("Teacher");
  teacherId = (
    await ok("POST", "/staff", {
      personId: teacherPerson,
      subject: "Math",
      rate: "5000",
    })
  ).id;
  roomId = (
    await ok("POST", "/rooms", { branchId, name: "Room A", capacity: 5 })
  ).id;
  groupId = (
    await ok("POST", "/groups", {
      branchId,
      teacherId,
      name: "Math",
      subject: "Math",
      capacity: 1,
    })
  ).id;
  cashId = (await ok("POST", "/accounts", { branchId, name: "Cash" })).id;
  const template = (
    await ok("POST", "/subscription-templates", {
      branchId,
      name: "10 lessons",
      subject: "Math",
      lessons: 10,
      days: 3650,
      price: "100000",
    })
  ).id;
  subId = (
    await ok("POST", "/subscriptions", {
      studentId,
      templateId: template,
      startsAt: "2026-01-01T00:00:00Z",
    })
  ).id;
  teacher = await user(teacherPerson, "teacher", [branchId]);
  manager = await user(await person("Manager"), "manager", [branchId]);
  payer = await user(personId, "payer");
  student = await user(child, "student");
});
after(async () => {
  if (server) await new Promise<void>((r) => server.close(() => r()));
  await pool.end();
});
test("health, CSRF, bad origin, input errors and legacy routes", async () => {
  assert.equal((await fetch(base + "/health/ready")).status, 200);
  assert.equal((await request("GET", "/people")).status, 401);
  assert.equal(
    (
      await request(
        "POST",
        "/people",
        { branchId, name: "No CSRF" },
        { ...director, csrf: "wrong" },
      )
    ).status,
    403,
  );
  const origin = await fetch(base + "/api/v1/people", {
    headers: { Cookie: director.cookie, Origin: "https://evil.example" },
  });
  assert.equal(origin.status, 403);
  const bad = await request(
    "POST",
    "/people",
    { branchId, name: "A", unknown: true },
    director,
  );
  assert.equal(bad.status, 400);
  assert.ok(bad.requestId);
  assert.equal(bad.error.code, "VALIDATION");
  assert.equal((await fetch(base + "/api/getglobalinfo")).status, 404);
  const malformed = await fetch(base + "/api/v1/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  const large = await fetch(base + "/api/v1/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "x".repeat(1100000) }),
  });
  assert.equal(large.status, 413);
});
test("tenant and branch isolation, user management authorization", async () => {
  assert.equal(
    (await request("GET", "/people/" + personId, undefined, other)).status,
    404,
  );
  const inaccessible = await person("Private second branch", secondBranch);
  assert.equal(
    (await request("GET", "/people/" + inaccessible, undefined, manager))
      .status,
    404,
  );
  const items = await ok("GET", "/people?pageSize=100", undefined, manager);
  assert.equal(
    items.items.some((v: any) => v.id === inaccessible),
    false,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/users",
        { personId, login: "bad-user", password: pass, roles: ["director"] },
        manager,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "PATCH",
        "/staff/" + teacherId,
        { rate: "9000", subject: "Math", status: "Работает" },
        manager,
      )
    ).status,
    403,
  );
  assert.equal(
    (await request("GET", "/ledger", undefined, teacher)).status,
    403,
  );
  assert.equal(
    (await ok("GET", "/staff", undefined, manager)).items.some(
      (v: any) => "rate" in v,
    ),
    false,
  );
});
test("concurrent normalized contacts cannot create duplicate people", async () => {
  const b = {
    branchId,
    name: "Contact holder",
    contacts: [{ kind: "phone", value: "8 (999) 123-45-67" }],
  };
  const results = await Promise.all([
    request("POST", "/people", b, director),
    request(
      "POST",
      "/people",
      { ...b, contacts: [{ kind: "phone", value: "+79991234567" }] },
      director,
    ),
  ]);
  assert.deepEqual(results.map((v) => v.status).sort(), [200, 409]);
});
test("concurrent enrollments respect capacity; students can join multiple groups", async () => {
  const results = await Promise.all([
    request("POST", `/groups/${groupId}/members`, { studentId }, director),
    request(
      "POST",
      `/groups/${groupId}/members`,
      { studentId: secondStudent },
      director,
    ),
  ]);
  assert.deepEqual(results.map((v) => v.status).sort(), [200, 409]);
  const g2 = (
    await ok("POST", "/groups", {
      branchId,
      teacherId,
      name: "Other group",
      subject: "Math",
      capacity: 2,
    })
  ).id;
  await ok("POST", `/groups/${g2}/members`, { studentId });
});
test("concurrent scheduling prevents overlaps; adjacent times accepted", async () => {
  const results = await Promise.all([
    request("POST", "/lessons", lesson(), director),
    request("POST", "/lessons", lesson(), director),
  ]);
  assert.deepEqual(results.map((v) => v.status).sort(), [200, 409]);
  lessonId = results.find((v) => v.status === 200)!.data.id;
  await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-01-10T11:00:00Z",
      endsAt: "2026-01-10T12:00:00Z",
    }),
  );
  const room2 = (
    await ok("POST", "/rooms", { branchId, name: "Room B", capacity: 5 })
  ).id;
  assert.equal(
    (await request("POST", "/lessons", lesson({ roomId: room2 }), director))
      .status,
    409,
  );
});
test("payments are atomic, exact and idempotent across concurrent requests", async () => {
  const b = {
    kind: "payment",
    accountId: cashId,
    payerId,
    amount: "50000",
    reason: "Cash tuition",
  };
  const key = randomUUID();
  const [a, b2] = await Promise.all([
    request("POST", "/transactions", b, manager, key),
    request("POST", "/transactions", b, manager, key),
  ]);
  assert.equal(a.status, 200);
  assert.deepEqual(a.data, b2.data);
  originalPaymentId = a.data.operationId;
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "50000",
  );
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        { ...b, amount: "1" },
        manager,
        key,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request("POST", "/transactions", { ...b, amount: "1" }, manager))
      .status,
    400,
  );
});
test("teacher first completion, retry, manager corrections, salary reversal", async () => {
  const b = {
    expectedRevision: 0,
    reason: "First attendance",
    attendance: [{ studentId, status: "present" }],
  };
  const key = randomUUID();
  const result = await ok(
    "POST",
    `/lessons/${lessonId}/complete`,
    b,
    teacher,
    key,
  );
  assert.equal(result.revision, 1);
  assert.deepEqual(
    await ok("POST", `/lessons/${lessonId}/complete`, b, teacher, key),
    result,
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "41000",
  );
  assert.equal(
    (await ok("GET", `/accounts/${teacherId}/balance`)).balance,
    "5000",
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).remaining,
    9,
  );
  assert.equal(
    (
      await request(
        "POST",
        `/lessons/${lessonId}/complete`,
        { ...b, expectedRevision: 1 },
        teacher,
        randomUUID(),
      )
    ).status,
    403,
  );
  await ok(
    "POST",
    `/lessons/${lessonId}/complete`,
    {
      expectedRevision: 1,
      reason: "Excused correction",
      attendance: [{ studentId, status: "excused" }],
    },
    manager,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "50000",
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).remaining,
    10,
  );
  assert.equal(
    (await ok("GET", `/accounts/${teacherId}/balance`)).balance,
    "5000",
  );
  await ok(
    "POST",
    `/lessons/${lessonId}/complete`,
    {
      expectedRevision: 2,
      reason: "Absent correction",
      attendance: [
        { studentId, status: "absent", price: "60000", discount: "0" },
      ],
    },
    manager,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "-10000",
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).remaining,
    9,
  );
  assert.equal(
    (
      await request(
        "POST",
        `/lessons/${lessonId}/complete`,
        { ...b, expectedRevision: 1 },
        manager,
        randomUUID(),
      )
    ).status,
    409,
  );
});
test("payer/student portals expose only linked learning data; no broad finance", async () => {
  const p = await ok("GET", "/students", undefined, payer);
  assert.equal(p.items.length, 2);
  const s = await ok("GET", "/students", undefined, student);
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].id, studentId);
  const teacherPeople = await ok("GET", "/people", undefined, teacher);
  assert.equal(
    teacherPeople.items.some((v: any) => v.id === personId),
    false,
  );
  const balance = await ok(
    "GET",
    `/accounts/${payerId}/balance`,
    undefined,
    payer,
  );
  assert.equal(balance.balance, "-10000");
  assert.equal(
    (await request("GET", `/accounts/${cashId}/balance`, undefined, payer))
      .status,
    404,
  );
  assert.equal(
    (await request("GET", "/accounts", undefined, student)).status,
    403,
  );
  const roster = await ok(
    "GET",
    `/lessons/${lessonId}/attendance`,
    undefined,
    student,
  );
  assert.equal(roster.items.length, 1);
  assert.equal("price" in roster.items[0], false);
});
test("refund and manual reversal preserve history; excessive cash out rejected", async () => {
  const op = await ok(
    "POST",
    "/transactions",
    {
      kind: "refund",
      originalPaymentId,
      accountId: cashId,
      payerId,
      amount: "1000",
      reason: "Refund",
    },
    manager,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "-11000",
  );
  await ok(
    "POST",
    `/transactions/${op.operationId}/reverse`,
    { reason: "Mistake" },
    manager,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "-10000",
  );
  assert.equal(
    (
      await request(
        "POST",
        `/transactions/${op.operationId}/reverse`,
        { reason: "Again" },
        manager,
        randomUUID(),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        {
          kind: "refund",
          originalPaymentId,
          accountId: cashId,
          payerId,
          amount: "100000",
          reason: "Too much",
        },
        manager,
        randomUUID(),
      )
    ).status,
    409,
  );
});
test("salary payments separate from accrual and manager cannot pay salary", async () => {
  const b = {
    kind: "salary_payment",
    accountId: cashId,
    staffId: teacherId,
    amount: "3000",
    reason: "Salary payment",
  };
  assert.equal(
    (await request("POST", "/transactions", b, manager, randomUUID())).status,
    403,
  );
  await ok("POST", "/transactions", b, director, randomUUID());
  assert.equal(
    (await ok("GET", `/accounts/${teacherId}/balance`)).balance,
    "2000",
  );
});
test("cancel conducted lesson compensates all charges and subscription usage", async () => {
  await ok(
    "POST",
    `/lessons/${lessonId}/cancel`,
    { expectedRevision: 3, reason: "Cancelled after correction" },
    manager,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "50000",
  );
  assert.equal(
    (await ok("GET", `/accounts/${teacherId}/balance`)).balance,
    "-3000",
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).remaining,
    10,
  );
});
test("lead conversion reuses person, payer and student", async () => {
  const input = {
    person: {
      branchId,
      name: "Lead parent",
      contacts: [{ kind: "email", value: "lead-" + suffix + "@example.com" }],
    },
    source: "Website",
  };
  const l1 = await ok("POST", "/leads", input);
  const duplicate = await request("POST", "/leads", input, director);
  assert.equal(duplicate.status, 409);
  const l2 = await ok("POST", "/leads", { personId: l1.personId });
  assert.equal(l1.personId, l2.personId);
  const a = await ok(
    "POST",
    `/leads/${l1.id}/convert`,
    {},
    manager,
    randomUUID(),
  );
  const b = await ok(
    "POST",
    `/leads/${l2.id}/convert`,
    {},
    manager,
    randomUUID(),
  );
  assert.equal(a.studentId, b.studentId);
  assert.equal(a.payerId, b.payerId);
});
test("subscription freeze extends actual duration; expiry does not change money", async () => {
  await ok("POST", `/subscriptions/${subId}/freeze`, {}, manager, randomUUID());
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).available,
    0,
  );
  const [original]: any = await pool.execute(
    "SELECT ends_at FROM crm_subscriptions WHERE id=?",
    [subId],
  );
  await pool.execute(
    "UPDATE crm_subscriptions SET frozen_at=DATE_SUB(frozen_at,INTERVAL 1 DAY) WHERE id=?",
    [subId],
  );
  const unfrozen = await ok(
    "POST",
    `/subscriptions/${subId}/unfreeze`,
    {},
    manager,
    randomUUID(),
  );
  assert.ok(
    Date.parse(unfrozen.endsAt) -
      Date.parse(original[0].ends_at.replace(" ", "T") + "Z") >=
      86400000,
  );
  await pool.execute(
    "UPDATE crm_subscriptions SET ends_at='2026-01-02 00:00:00' WHERE id=?",
    [subId],
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${subId}/availability`)).available,
    0,
  );
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "50000",
  );
});
test("XLSX import atomic rollback, child without contacts, retry safety", async () => {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Import");
  sheet.addRow(["name", "email"]);
  sheet.addRow([
    "Import unique " + suffix,
    "import-" + suffix + "@example.com",
  ]);
  sheet.addRow(["Invalid", "not-email"]);
  const bad = await request(
    "POST",
    "/imports/people",
    {
      branchId,
      kind: "people",
      fileBase64: Buffer.from(await wb.xlsx.writeBuffer()).toString("base64"),
    },
    manager,
    randomUUID(),
  );
  assert.equal(bad.status, 400);
  assert.equal(
    (
      await ok(
        "GET",
        "/people?q=" + encodeURIComponent("Import unique " + suffix),
      )
    ).total,
    0,
  );
  sheet.spliceRows(3, 1);
  const body = {
    branchId,
    kind: "people",
    fileBase64: Buffer.from(await wb.xlsx.writeBuffer()).toString("base64"),
  };
  const key = randomUUID();
  const a = await ok("POST", "/imports/people", body, manager, key);
  assert.deepEqual(await ok("POST", "/imports/people", body, manager, key), a);
  assert.equal(a.rows.length, 1);
});
test("OpenAPI generated from actual registered routes and logout revocation", async () => {
  const spec = await (await fetch(base + "/api/v1/openapi.json")).json();
  assert.ok(spec.paths["/api/v1/lessons/{id}/complete"].post.requestBody);
  assert.ok(
    spec.paths["/api/v1/transactions"].post.parameters.some(
      (v: any) => v.name === "Idempotency-Key",
    ),
  );
  await ok("POST", "/auth/logout", {}, teacher);
  assert.equal(
    (await request("GET", "/auth/me", undefined, teacher)).status,
    401,
  );
});
test("expired subscription cannot consume unused allowance even for a past lesson", async () => {
  const l = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-01-01T10:00:00Z",
      endsAt: "2026-01-01T11:00:00Z",
    }),
  );
  const result = await request(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      expectedRevision: 0,
      reason: "Too late",
      attendance: [{ studentId, status: "present" }],
    },
    manager,
    randomUUID(),
  );
  assert.equal(result.status, 409);
  assert.equal(result.error.code, "SUBSCRIPTION_EXPIRED");
  assert.equal((await ok("GET", `/lessons/${l.id}`)).status, "scheduled");
  assert.equal(
    (await ok("GET", `/accounts/${payerId}/balance`)).balance,
    "50000",
  );
});
test("room collision with a different teacher is rejected, rescheduling frees slot", async () => {
  const teacher2 = (
    await ok("POST", "/staff", {
      personId: await person("Substitute teacher"),
      subject: "Math",
      rate: "8000",
    })
  ).id;
  const l = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-02-01T10:00:00Z",
      endsAt: "2026-02-01T11:00:00Z",
    }),
  );
  const conflict = await request(
    "POST",
    "/lessons",
    lesson({
      teacherId: teacher2,
      startsAt: "2026-02-01T10:30:00Z",
      endsAt: "2026-02-01T11:30:00Z",
    }),
    manager,
  );
  assert.equal(conflict.status, 409);
  await ok(
    "PATCH",
    `/lessons/${l.id}`,
    {
      ...lesson({
        teacherId: teacher2,
        startsAt: "2026-02-01T12:00:00Z",
        endsAt: "2026-02-01T13:00:00Z",
      }),
      expectedRevision: 0,
    },
    manager,
  );
  await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-02-01T10:00:00Z",
      endsAt: "2026-02-01T11:00:00Z",
    }),
    manager,
  );
  assert.equal((await ok("GET", `/lessons/${l.id}`)).salary, "8000");
  assert.equal(
    (
      await request(
        "PATCH",
        `/lessons/${l.id}`,
        {
          ...lesson({
            teacherId: teacher2,
            startsAt: "2026-02-01T14:00:00Z",
            endsAt: "2026-02-01T15:00:00Z",
            salary: "1",
          }),
          expectedRevision: 1,
        },
        manager,
      )
    ).status,
    403,
  );
});
test("comments, announcements, tasks, internal notifications and own profile", async () => {
  const announcement = await ok("POST", "/announcements", {
    branchId,
    name: "Schedule change",
    description: "New semester",
  });
  assert.equal(
    (await ok("GET", "/announcements", undefined, manager)).items.some(
      (v: any) => v.id === announcement.id,
    ),
    true,
  );
  const task = await ok("POST", "/tasks", {
    branchId,
    name: "Prepare lesson",
    date: "2026-11-01",
    responsibleId: teacherId,
  });
  assert.ok(task.id);
  await ok(
    "POST",
    "/comments",
    { resource: "students", resourceId: studentId, text: "Learning note" },
    manager,
  );
  assert.equal(
    (
      await ok(
        "GET",
        `/comments?resource=students&resourceId=${studentId}`,
        undefined,
        manager,
      )
    ).items.length,
    1,
  );
  assert.equal(
    (
      await request(
        "GET",
        `/comments?resource=students&resourceId=${studentId}`,
        undefined,
        payer,
      )
    ).status,
    403,
  );
  const p = await ok("GET", "/profile", undefined, payer);
  assert.equal(p.person.id, personId);
  await ok(
    "PATCH",
    "/profile",
    {
      fullName: "Parent renamed",
      email: "parent-renamed-" + suffix + "@example.com",
    },
    payer,
  );
  assert.equal(
    (await ok("GET", "/profile", undefined, payer)).person.name,
    "Parent renamed",
  );
  const count = (
    await pool.execute<any[]>(
      "SELECT COUNT(*) AS n FROM crm_notifications WHERE org_id=(SELECT org_id FROM crm_staff WHERE id=?)",
      [teacherId],
    )
  )[0][0].n;
  assert.ok(Number(count) > 0);
});
test("concurrent withdrawals cannot overdraw cash", async () => {
  const account = (
    await ok("POST", "/accounts", { branchId, name: "Concurrency cash" })
  ).id;
  await ok(
    "POST",
    "/transactions",
    {
      kind: "payment",
      payerId,
      accountId: account,
      amount: "10000",
      reason: "Opening",
    },
    director,
    randomUUID(),
  );
  const b = {
    kind: "refund",
    originalPaymentId,
    accountId: account,
    payerId,
    amount: "7000",
    reason: "Concurrent refund",
  };
  const result = await Promise.all([
    request("POST", "/transactions", b, manager, randomUUID()),
    request("POST", "/transactions", b, manager, randomUUID()),
  ]);
  assert.deepEqual(result.map((v) => v.status).sort(), [200, 409]);
  assert.equal(
    (await ok("GET", `/accounts/${account}/balance`)).balance,
    "3000",
  );
});
test("frozen and exhausted passes reject new consumption atomically", async () => {
  const template = (
    await ok("POST", "/subscription-templates", {
      branchId,
      name: "Single lesson",
      subject: "Math",
      lessons: 1,
      days: 3650,
      price: "1000",
    })
  ).id;
  const sub = (
    await ok("POST", "/subscriptions", {
      studentId,
      templateId: template,
      startsAt: "2026-01-01T00:00:00Z",
    })
  ).id;
  const a = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-03-01T10:00:00Z",
      endsAt: "2026-03-01T11:00:00Z",
      attendees: [{ studentId, price: "1000", subscriptionId: sub }],
    }),
  );
  const b = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-03-01T11:00:00Z",
      endsAt: "2026-03-01T12:00:00Z",
      attendees: [{ studentId, price: "1000", subscriptionId: sub }],
    }),
  );
  await ok("POST", `/subscriptions/${sub}/freeze`, {}, manager, randomUUID());
  const body = {
    expectedRevision: 0,
    reason: "Attendance",
    attendance: [{ studentId, status: "present" }],
  };
  const frozen = await request(
    "POST",
    `/lessons/${a.id}/complete`,
    body,
    manager,
    randomUUID(),
  );
  assert.equal(frozen.status, 409);
  assert.equal(frozen.error.code, "SUBSCRIPTION_FROZEN");
  await ok("POST", `/subscriptions/${sub}/unfreeze`, {}, manager, randomUUID());
  const result = await Promise.all([
    request("POST", `/lessons/${a.id}/complete`, body, manager, randomUUID()),
    request("POST", `/lessons/${b.id}/complete`, body, manager, randomUUID()),
  ]);
  assert.deepEqual(result.map((v) => v.status).sort(), [200, 409]);
  assert.equal(
    (await ok("GET", `/subscriptions/${sub}/availability`)).remaining,
    0,
  );
});

test("education pricing, schedule filters, payer selection, null room limit and atomic correction", async () => {
  const [users] = await pool.execute<any[]>(
    "SELECT login FROM crm_users WHERE person_id=?",
    [teacherPerson],
  );
  const login = await request("POST", "/auth/login", {
    login: users[0].login,
    password: pass,
  });
  assert.equal(login.status, 200);
  teacher = { cookie: login.cookie, csrf: login.data.csrfToken };
  const unlimited = (
    await ok("POST", "/rooms", { branchId, name: "Unlimited", capacity: null })
  ).id;
  const b = lesson({
    roomId: unlimited,
    basePrice: "101",
    timezone: "Europe/Moscow",
    startsAt: "2026-04-11T10:00:00Z",
    endsAt: "2026-04-11T11:00:00Z",
    attendees: [{ studentId, payerId, discountPercent: 5000 }],
  });
  const l = await ok("POST", "/lessons", b);
  const roster = await ok("GET", `/lessons/${l.id}/attendance`);
  assert.equal(roster.items[0].attendance, null);
  assert.equal(roster.items[0].price, "101");
  assert.equal(roster.items[0].discount, "50");
  assert.equal(roster.items[0].payer_id, payerId);
  assert.equal(
    (await request("GET", "/lessons", undefined, director)).status,
    400,
  );
  assert.equal(
    (
      await request(
        "GET",
        "/lessons?from=2026-01-01T00:00:00Z&to=2027-01-01T00:00:00Z",
        undefined,
        director,
      )
    ).status,
    400,
  );
  const list = await ok(
    "GET",
    `/lessons?from=2026-04-11T10:30:00Z&to=2026-04-11T12:00:00Z&roomId=${unlimited}&studentId=${studentId}&teacherId=${teacherId}&branchId=${branchId}`,
  );
  assert.equal(list.total, 1);
  assert.equal(list.items[0].id, l.id);
  const complete = {
    expectedRevision: 0,
    reason: "Test",
    attendance: [{ studentId, status: "present" }],
  };
  assert.equal(
    (
      await request(
        "POST",
        `/lessons/${l.id}/complete`,
        complete,
        payer,
        randomUUID(),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "POST",
        `/lessons/${l.id}/complete`,
        { ...complete, attendance: [] },
        director,
        randomUUID(),
      )
    ).status,
    400,
  );
  await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    complete,
    teacher,
    randomUUID(),
  );
  const [entries] = await pool.execute<any[]>(
    "SELECT amount FROM crm_ledger WHERE lesson_id=? AND kind='lesson_charge'",
    [l.id],
  );
  assert.equal(entries[0].amount, "-51");
  await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      ...complete,
      expectedRevision: 1,
      attendance: [{ studentId, status: "excused" }],
    },
    director,
    randomUUID(),
  );
  const [sum] = await pool.execute<any[]>(
    "SELECT SUM(amount) n FROM crm_ledger WHERE lesson_id=? AND account_id=?",
    [l.id, payerId],
  );
  assert.equal(String(sum[0].n), "0");
  assert.equal(
    (
      await request(
        "POST",
        "/lessons",
        { ...b, timezone: "bad/zone" },
        director,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/lessons",
        { ...b, attendees: [{ studentId, discount: "1", discountPercent: 0 }] },
        director,
      )
    ).status,
    400,
  );
});
test("reschedules serialize, cancelled slots free time and teacher branch must match", async () => {
  const make = (hour: number) =>
    lesson({
      startsAt: `2026-04-12T${hour}:00:00Z`,
      endsAt: `2026-04-12T${hour + 1}:00:00Z`,
      attendees: [{ studentId, price: "100" }],
    });
  const a = await ok("POST", "/lessons", make(10));
  const b = await ok("POST", "/lessons", make(11));
  const results = await Promise.all([
    request(
      "PATCH",
      `/lessons/${a.id}`,
      { ...make(12), expectedRevision: 0 },
      director,
    ),
    request(
      "PATCH",
      `/lessons/${b.id}`,
      { ...make(12), expectedRevision: 0 },
      director,
    ),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const winner = results[0].status === 200 ? a : b;
  await ok(
    "POST",
    `/lessons/${winner.id}/cancel`,
    { expectedRevision: 1, reason: "Cancel" },
    director,
    randomUUID(),
  );
  await ok("POST", "/lessons", make(12));
  const foreignTeacher = (
    await ok("POST", "/staff", {
      personId: await person("Foreign teacher", secondBranch),
      subject: "Math",
      rate: "0",
    })
  ).id;
  const r = await request(
    "POST",
    "/lessons",
    { ...make(14), teacherId: foreignTeacher },
    director,
  );
  assert.equal(r.status, 409);
});
test("issued subscription snapshots, applicability, selected pass, usage returns and boundary expiry", async () => {
  const template = await ok("POST", "/subscription-templates", {
    branchId,
    name: "Scope",
    subject: "Math",
    groupId,
    lessons: 2,
    days: 3650,
    price: "0",
  });
  const sub = await ok("POST", "/subscriptions", {
    studentId,
    templateId: template.id,
    startsAt: "2026-01-01T00:00:00Z",
  });
  const base = lesson({
    startsAt: "2026-04-13T10:00:00Z",
    endsAt: "2026-04-13T11:00:00Z",
    attendees: [{ studentId, price: "100", subscriptionId: sub.id }],
  });
  assert.equal(
    (await request("POST", "/lessons", base, director)).error.code,
    "SUBSCRIPTION_GROUP",
  );
  const unrestricted = await ok("POST", "/subscription-templates", {
    branchId,
    name: "Subject",
    subject: "Math",
    lessons: 2,
    days: 3650,
    price: "0",
  });
  const chosen = await ok("POST", "/subscriptions", {
    studentId,
    templateId: unrestricted.id,
    startsAt: "2026-01-01T00:00:00Z",
  });
  await ok("PATCH", `/subscription-templates/${unrestricted.id}`, {
    branchId,
    name: "Changed",
    subject: "Music",
    lessons: 99,
    days: 1,
    price: "0",
  });
  const snap = await ok("GET", `/subscriptions/${chosen.id}`);
  assert.equal(snap.subject, "Math");
  assert.equal(snap.allowance, 2);
  assert.equal(
    (
      await request(
        "POST",
        "/lessons",
        {
          ...base,
          subject: "Music",
          attendees: [{ studentId, price: "100", subscriptionId: chosen.id }],
        },
        director,
      )
    ).error.code,
    "SUBSCRIPTION_SUBJECT",
  );
  const l = await ok("POST", "/lessons", {
    ...base,
    attendees: [{ studentId, price: "100" }],
  });
  const body = {
    expectedRevision: 0,
    reason: "Select pass",
    attendance: [{ studentId, status: "present", subscriptionId: chosen.id }],
  };
  await ok("POST", `/lessons/${l.id}/complete`, body, director, randomUUID());
  assert.equal(
    (await ok("GET", `/subscriptions/${chosen.id}/availability`)).remaining,
    1,
  );
  await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      ...body,
      expectedRevision: 1,
      attendance: [{ studentId, status: "excused", subscriptionId: null }],
    },
    director,
    randomUUID(),
  );
  const history = await ok("GET", `/subscriptions/${chosen.id}/usage`);
  assert.equal(history.total, 2);
  assert.equal(
    history.items.reduce((n: number, u: any) => n + u.delta, 0),
    0,
  );
  const endLesson = await ok("POST", "/lessons", {
    ...base,
    startsAt: "2026-04-14T10:00:00Z",
    endsAt: "2026-04-14T11:00:00Z",
    attendees: [{ studentId, price: "100", subscriptionId: chosen.id }],
  });
  await pool.execute(
    "UPDATE crm_subscriptions SET ends_at='2026-04-14 10:00:00' WHERE id=?",
    [chosen.id],
  );
  const failed = await request(
    "POST",
    `/lessons/${endLesson.id}/complete`,
    { ...body, attendance: [{ studentId, status: "present" }] },
    director,
    randomUUID(),
  );
  assert.equal(failed.error.code, "SUBSCRIPTION_EXPIRED");
  assert.equal(
    (await ok("GET", `/lessons/${endLesson.id}`)).status,
    "scheduled",
  );
  assert.equal(
    (await ok("GET", `/lessons/${endLesson.id}/attendance`)).items[0]
      .attendance,
    null,
  );
});
test("subscription starts inclusive and historical freeze ends exclusive", async () => {
  const template = await ok("POST", "/subscription-templates", {
    branchId,
    name: "Boundary",
    subject: "Math",
    lessons: 2,
    days: 3650,
    price: "0",
  });
  const sub = await ok("POST", "/subscriptions", {
    studentId,
    templateId: template.id,
    startsAt: "2026-04-16T10:00:00Z",
  });
  const l = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-04-16T10:00:00Z",
      endsAt: "2026-04-16T11:00:00Z",
      attendees: [{ studentId, price: "100", subscriptionId: sub.id }],
    }),
  );
  await pool.execute(
    "INSERT INTO crm_freezes(id,org_id,subscription_id,starts_at,ends_at) SELECT ?,org_id,id,'2026-04-16 09:00:00','2026-04-16 10:00:00' FROM crm_subscriptions WHERE id=?",
    [randomUUID(), sub.id],
  );
  await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      expectedRevision: 0,
      reason: "Boundary",
      attendance: [{ studentId, status: "present" }],
    },
    director,
    randomUUID(),
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${sub.id}/availability`)).remaining,
    1,
  );
  const blocked = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-04-16T11:00:00Z",
      endsAt: "2026-04-16T12:00:00Z",
      attendees: [{ studentId, price: "100", subscriptionId: sub.id }],
    }),
  );
  await pool.execute(
    "INSERT INTO crm_freezes(id,org_id,subscription_id,starts_at,ends_at) SELECT ?,org_id,id,'2026-04-16 11:00:00','2026-04-16 11:30:00' FROM crm_subscriptions WHERE id=?",
    [randomUUID(), sub.id],
  );
  const r = await request(
    "POST",
    `/lessons/${blocked.id}/complete`,
    {
      expectedRevision: 0,
      reason: "Boundary",
      attendance: [{ studentId, status: "present" }],
    },
    director,
    randomUUID(),
  );
  assert.equal(r.error.code, "SUBSCRIPTION_FROZEN");
});
test("financial failure rolls attendance, allowance and status back", async () => {
  const template = await ok("POST", "/subscription-templates", {
    branchId,
    name: "Atomic",
    subject: "Math",
    lessons: 1,
    days: 3650,
    price: "0",
  });
  const sub = await ok("POST", "/subscriptions", {
    studentId,
    templateId: template.id,
    startsAt: "2026-01-01T00:00:00Z",
  });
  const l = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-04-15T10:00:00Z",
      endsAt: "2026-04-15T11:00:00Z",
      attendees: [{ studentId, price: "100", subscriptionId: sub.id }],
    }),
  );
  const body = {
    expectedRevision: 0,
    reason: "Atomic",
    attendance: [{ studentId, status: "present" }],
  };
  const key = randomUUID();
  const { transaction } = await import("../../src/core/db.js");
  const { conductLesson } = await import("../../src/modules/education.js");
  const currentActor = await ok("GET", "/auth/me");
  await assert.rejects(
    transaction(currentActor.org, async (db) => {
      const failingDb = new Proxy(db, {
        get(target, property) {
          if (property === "execute")
            return async (sql: string, args: any[]) => {
              if (
                sql.startsWith("INSERT INTO crm_ledger") &&
                args[4] === "salary_accrual"
              )
                throw new Error("Injected ledger failure");
              return target.execute(sql, args);
            };
          const value = Reflect.get(target, property);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
      return conductLesson(
        {
          db: failingDb,
          actor: currentActor,
          requestId: randomUUID(),
          req: { params: { id: l.id } } as any,
        },
        body,
      );
    }),
    /Injected ledger failure/,
  );
  assert.equal((await ok("GET", `/lessons/${l.id}`)).status, "scheduled");
  assert.equal(
    (await ok("GET", `/lessons/${l.id}/attendance`)).items[0].attendance,
    null,
  );
  assert.equal(
    (await ok("GET", `/subscriptions/${sub.id}/availability`)).remaining,
    1,
  );
  const [entries] = await pool.execute<any[]>(
    "SELECT COUNT(*) n FROM crm_ledger WHERE lesson_id=?",
    [l.id],
  );
  assert.equal(Number(entries[0].n), 0);
  await ok("POST", `/lessons/${l.id}/complete`, body, director, key);
});
test("changing permissions revokes active sessions and protects own director account", async () => {
  const own = await ok("GET", "/auth/me");
  assert.equal(
    (
      await request(
        "PATCH",
        `/users/${own.id}`,
        { roles: ["manager"], branchIds: [], active: true },
        director,
      )
    ).status,
    409,
  );
  const m = await ok("GET", "/auth/me", undefined, manager);
  await ok("PATCH", `/users/${m.id}`, {
    roles: ["manager"],
    branchIds: [secondBranch],
    active: true,
  });
  assert.equal(
    (await request("GET", "/people", undefined, manager)).status,
    401,
  );
});
test("employee plus payer roles unite scoped work access and own children across branches", async () => {
  const p = await person("Teacher and parent");
  const t = (
    await ok("POST", "/staff", { personId: p, subject: "Math", rate: "1000" })
  ).id;
  const py = (await ok("POST", "/payers", { personId: p })).id;
  const ch = await person("Own child in another branch", secondBranch);
  const st = (await ok("POST", "/students", { personId: ch, payerId: py })).id;
  const login = "both-" + suffix;
  await ok("POST", "/users", {
    personId: p,
    login,
    password: pass,
    roles: ["teacher", "payer"],
    branchIds: [branchId],
  });
  const r = await request("POST", "/auth/login", { login, password: pass });
  assert.equal(r.status, 200);
  const both = { cookie: r.cookie, csrf: r.data.csrfToken };
  assert.equal(
    (await ok("GET", `/students?branchId=${secondBranch}`, undefined, both))
      .items.length,
    1,
  );
  const students = await ok("GET", "/students", undefined, both);
  assert.equal(students.items.length, 1);
  assert.equal(students.items[0].id, st);
  assert.equal(
    (await ok("GET", `/accounts/${py}/balance`, undefined, both)).balance,
    "0",
  );
  assert.equal(
    (await request("GET", `/accounts/${payerId}/balance`, undefined, both))
      .status,
    404,
  );
  const assigned = await ok(
    "POST",
    "/lessons",
    lesson({
      teacherId: t,
      startsAt: "2026-04-01T10:00:00Z",
      endsAt: "2026-04-01T11:00:00Z",
      attendees: [{ studentId, price: "12345" }],
    }),
  );
  const attendance = await ok(
    "GET",
    `/lessons/${assigned.id}/attendance`,
    undefined,
    both,
  );
  assert.equal(attendance.items.length, 1);
  assert.equal(
    "price" in attendance.items[0],
    false,
    "payer role must not expose prices of unrelated teaching students",
  );
});
test("analytics aggregates four widgets, scopes branches and persists user preferences", async () => {
  const data = await ok(
    "GET",
    "/analytics/overview?from=2026-01-01T00%3A00%3A00Z&to=2027-01-01T00%3A00%3A00Z",
  );
  assert.equal(data.sales.length, 6);
  assert.equal(data.lessons.length, 3);
  assert.equal(data.attendance.length, 3);
  assert.equal(
    BigInt(data.finance.income) - BigInt(data.finance.expense),
    BigInt(data.finance.net),
  );
  assert.ok(data.lessons.find((v: any) => v.status === "completed").count > 0);
  await ok("PATCH", "/widgets", { ids: ["finance", "attendance"] });
  assert.deepEqual((await ok("GET", "/widgets")).ids, [
    "finance",
    "attendance",
  ]);
  assert.equal(
    (
      await request(
        "GET",
        "/analytics/overview?from=2026-01-01T00%3A00%3A00Z&to=2027-01-01T00%3A00%3A00Z",
        undefined,
        payer,
      )
    ).status,
    403,
  );
});

test("finance: partial refunds, concurrent retry, cap and compensation", async () => {
  const account = (
    await ok("POST", "/accounts", { branchId, name: "Refund test" })
  ).id;
  const payment = await ok(
    "POST",
    "/transactions",
    {
      kind: "payment",
      accountId: account,
      payerId,
      amount: "1000",
      reason: "Original",
    },
    director,
    randomUUID(),
  );
  const body = {
    kind: "refund",
    accountId: account,
    payerId,
    originalPaymentId: payment.operationId,
    amount: "600",
    reason: "Partial",
  };
  const key = randomUUID();
  const retries = await Promise.all([
    request("POST", "/transactions", body, director, key),
    request("POST", "/transactions", body, director, key),
  ]);
  assert.equal(retries[0].status, 200);
  assert.equal(retries[1].status, 200);
  assert.deepEqual(retries[0].data, retries[1].data);
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        { ...body, amount: "601" },
        director,
        key,
      )
    ).error.code,
    "IDEMPOTENCY_CONFLICT",
  );
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        { ...body, amount: "401" },
        director,
        randomUUID(),
      )
    ).error.code,
    "REFUND_EXCEEDED",
  );
  assert.equal(
    (
      await request(
        "POST",
        `/transactions/${payment.operationId}/reverse`,
        { reason: "Correction" },
        director,
        randomUUID(),
      )
    ).error.code,
    "PAYMENT_HAS_REFUNDS",
  );
  const parts = await Promise.all([
    request(
      "POST",
      "/transactions",
      { ...body, amount: "300" },
      director,
      randomUUID(),
    ),
    request(
      "POST",
      "/transactions",
      { ...body, amount: "300" },
      director,
      randomUUID(),
    ),
  ]);
  assert.deepEqual(parts.map((v) => v.status).sort(), [200, 409]);
  await ok(
    "POST",
    `/transactions/${retries[0].data.operationId}/reverse`,
    { reason: "Refund error" },
    director,
    randomUUID(),
  );
  await ok(
    "POST",
    "/transactions",
    { ...body, amount: "700" },
    director,
    randomUUID(),
  );
  assert.equal((await ok("GET", `/accounts/${account}/balance`)).balance, "0");
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        { ...body, originalPaymentId: randomUUID() },
        director,
        randomUUID(),
      )
    ).error.code,
    "INVALID_PAYMENT",
  );
  assert.equal(
    (
      await request(
        "POST",
        "/transactions",
        { ...body, reason: " " },
        director,
        randomUUID(),
      )
    ).status,
    400,
  );
});

test("finance: concurrent completion and correction, immutable snapshots, teacher replacement and cancellation", async () => {
  const t = (
    await ok("POST", "/staff", {
      personId: await person("Replacement"),
      subject: "Math",
      rate: "1234",
    })
  ).id;
  const l = await ok(
    "POST",
    "/lessons",
    lesson({
      startsAt: "2026-05-01T10:00:00Z",
      endsAt: "2026-05-01T11:00:00Z",
      attendees: [{ studentId, price: "101", discountPercent: 5000 }],
    }),
  );
  const body = {
    expectedRevision: 0,
    reason: "Conduct",
    attendance: [{ studentId, status: "absent" }],
  };
  const result = await Promise.all([
    request("POST", `/lessons/${l.id}/complete`, body, director, randomUUID()),
    request("POST", `/lessons/${l.id}/complete`, body, director, randomUUID()),
  ]);
  assert.deepEqual(result.map((v) => v.status).sort(), [200, 409]);
  const correction = {
    ...body,
    expectedRevision: 1,
    teacherId: t,
    attendance: [
      { studentId, status: "present", price: "201", discountPercent: 5000 },
    ],
  };
  const key = randomUUID();
  const failedCorrection = await request(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      ...correction,
      attendance: [{ studentId, status: "present", price: "0", discount: "1" }],
    },
    director,
    key,
  );
  assert.equal(failedCorrection.status, 400);
  assert.equal((await ok("GET", `/lessons/${l.id}`)).revision, 1);
  assert.deepEqual(
    (await ok("GET", `/lessons/${l.id}/versions`)).items.map(
      (v: any) => v.revision,
    ),
    [1, 0],
  );
  const corrected = await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    correction,
    director,
    key,
  );
  assert.deepEqual(
    await ok("POST", `/lessons/${l.id}/complete`, correction, director, key),
    corrected,
  );
  const [totals] = await pool.execute<any[]>(
    "SELECT account_id,SUM(amount) amount FROM crm_ledger WHERE lesson_id=? GROUP BY account_id",
    [l.id],
  );
  assert.equal(
    String(totals.find((v) => v.account_id === teacherId).amount),
    "0",
  );
  assert.equal(String(totals.find((v) => v.account_id === t).amount), "1234");
  assert.equal(
    String(totals.find((v) => v.account_id === payerId).amount),
    "-101",
  );
  const versions = await ok("GET", `/lessons/${l.id}/versions`);
  assert.deepEqual(
    versions.items.map((v: any) => v.revision),
    [2, 1, 0],
  );
  assert.equal(versions.items[1].attendees[0].attendance, "absent");
  assert.equal(versions.items[1].lesson.teacher_id, teacherId);
  assert.equal(versions.items[0].lesson.teacher_id, t);
  const cancel = { expectedRevision: 2, reason: "Cancelled after correction" },
    cancelKey = randomUUID();
  const cancelled = await ok(
    "POST",
    `/lessons/${l.id}/cancel`,
    cancel,
    director,
    cancelKey,
  );
  assert.deepEqual(
    await ok("POST", `/lessons/${l.id}/cancel`, cancel, director, cancelKey),
    cancelled,
  );
  const [after] = await pool.execute<any[]>(
    "SELECT account_id,SUM(amount) amount FROM crm_ledger WHERE lesson_id=? GROUP BY account_id",
    [l.id],
  );
  assert.ok(after.every((v) => String(v.amount) === "0"));
});

test("finance: report result excludes advances, transfers and paid salary; scoped history", async () => {
  // Isolated branch makes every expected total independent of preceding tests.
  const br = (await ok("POST", "/branches", { name: "Finance report" })).id;
  const account = (
    await ok("POST", "/accounts", { branchId: br, name: "Cash" })
  ).id;
  const bank = (await ok("POST", "/accounts", { branchId: br, name: "Bank" }))
    .id;
  const p = (
    await ok("POST", "/payers", { personId: await person("Report payer", br) })
  ).id;
  const st = (
    await ok("POST", "/students", {
      personId: await person("Report student", br),
      payerId: p,
    })
  ).id;
  const t = (
    await ok("POST", "/staff", {
      personId: await person("Report teacher", br),
      subject: "Math",
      rate: "200",
    })
  ).id;
  const room = (
    await ok("POST", "/rooms", {
      branchId: br,
      name: "Report room",
      capacity: 5,
    })
  ).id;
  const payment = await ok(
    "POST",
    "/transactions",
    {
      kind: "payment",
      accountId: account,
      payerId: p,
      amount: "1000",
      reason: "Advance",
    },
    director,
    randomUUID(),
  );
  const l = await ok("POST", "/lessons", {
    ...lesson({}),
    branchId: br,
    teacherId: t,
    roomId: room,
    salary: "200",
    attendees: [{ studentId: st, price: "1500" }],
  });
  await ok(
    "POST",
    `/lessons/${l.id}/complete`,
    {
      expectedRevision: 0,
      reason: "Conduct",
      attendance: [{ studentId: st, status: "present" }],
    },
    director,
    randomUUID(),
  );
  await ok(
    "POST",
    "/transactions",
    {
      kind: "refund",
      accountId: account,
      payerId: p,
      originalPaymentId: payment.operationId,
      amount: "100",
      reason: "Refund",
    },
    director,
    randomUUID(),
  );
  await ok(
    "POST",
    "/transactions",
    { kind: "expense", accountId: account, amount: "50", reason: "Materials" },
    director,
    randomUUID(),
  );
  await ok(
    "POST",
    "/transactions",
    {
      kind: "salary_payment",
      accountId: account,
      staffId: t,
      amount: "100",
      reason: "Partial payroll",
    },
    director,
    randomUUID(),
  );
  const transfer = {
      fromAccountId: account,
      toAccountId: bank,
      amount: "300",
      reason: "Deposit",
    },
    key = randomUUID();
  const moved = await ok("POST", "/transfers", transfer, director, key);
  assert.deepEqual(
    await ok("POST", "/transfers", transfer, director, key),
    moved,
  );
  const from = new Date(Date.now() - 86400000).toISOString(),
    to = new Date(Date.now() + 86400000).toISOString();
  const report = await ok(
    "GET",
    `/reports/finance?from=${from}&to=${to}&branchId=${br}`,
  );
  for (const [field, value] of Object.entries({
    payments: "1000",
    refunds: "100",
    expenses: "50",
    tuitionAccrued: "1500",
    salaryAccrued: "200",
    salaryPaid: "100",
    cashFlow: "750",
    transfersNet: "0",
    financialResult: "1250",
  }))
    assert.equal(report[field], value, field);
  const overview = await ok(
    "GET",
    `/analytics/overview?from=${from}&to=${to}&branchId=${br}`,
  );
  assert.equal(overview.finance.income, "1000");
  assert.equal(overview.finance.expense, "250");
  assert.equal(overview.finance.net, "750");
  assert.equal(overview.finance.transfersNet, "0");
  assert.equal(report.payerDebts[0].debt, "600");
  assert.equal(report.payroll[0].balance, "100");
  assert.equal(
    report.cashBalances.find((a: any) => a.id === account).balance,
    "450",
  );
  assert.equal(
    report.cashBalances.find((a: any) => a.id === bank).balance,
    "300",
  );
  assert.equal(
    (await request("GET", `/accounts/${account}/history`, undefined, payer))
      .status,
    404,
  );
  assert.equal((await ok("GET", `/accounts/${p}/history`)).balance, "-600");
  const m = await user(await person("Finance manager", br), "manager", [br]);
  assert.equal(
    (
      await request(
        "GET",
        `/reports/finance?from=${from}&to=${to}`,
        undefined,
        m,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/transfers",
        { ...transfer, toAccountId: cashId },
        m,
        randomUUID(),
      )
    ).status,
    403,
  );
  assert.equal(
    (await request("POST", "/transfers", transfer, teacher, randomUUID()))
      .status,
    403,
  );
  assert.equal(
    (
      await request(
        "POST",
        `/lessons/${l.id}/complete`,
        {
          expectedRevision: 1,
          reason: "Rate",
          salary: "1",
          attendance: [{ studentId: st, status: "present" }],
        },
        m,
        randomUUID(),
      )
    ).status,
    403,
  );
  const update = {
    expectedRevision: 1,
    reason: "Excused",
    attendance: [{ studentId: st, status: "excused" }],
  };
  await ok("POST", `/lessons/${l.id}/complete`, update, m, randomUUID());
  const corrected = await ok(
    "GET",
    `/reports/finance?from=${from}&to=${to}&branchId=${br}`,
  );
  assert.equal(corrected.tuitionAccrued, "0");
  assert.equal(corrected.financialResult, "-250");
  assert.equal(corrected.payments, "1000");
});

test("finance: unlinked legacy refunds block new refunds until compensated", async () => {
  const operation = randomUUID();
  const { org } = await ok("GET", "/auth/me");
  for (const account of [cashId, payerId])
    await pool.execute(
      "INSERT INTO crm_ledger(id,org_id,account_id,amount,kind,operation_id,reason) VALUES(?,?,?,-1,'refund',?,'Legacy refund')",
      [randomUUID(), org, account, operation],
    );
  const body = {
    kind: "refund",
    accountId: cashId,
    payerId,
    originalPaymentId,
    amount: "1",
    reason: "Test",
  };
  assert.equal(
    (await request("POST", "/transactions", body, director, randomUUID())).error
      .code,
    "LEGACY_REFUNDS_UNRESOLVED",
  );
  assert.equal(
    (
      await request(
        "POST",
        `/transactions/${originalPaymentId}/reverse`,
        { reason: "Test" },
        director,
        randomUUID(),
      )
    ).error.code,
    "LEGACY_REFUNDS_UNRESOLVED",
  );
  await ok(
    "POST",
    `/transactions/${operation}/reverse`,
    { reason: "Legacy reconciliation" },
    director,
    randomUUID(),
  );
  await ok("POST", "/transactions", body, director, randomUUID());
});
