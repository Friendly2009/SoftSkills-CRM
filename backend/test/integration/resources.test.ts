import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (!process.env.DB_NAME?.endsWith("_test"))
  throw new Error("Dedicated _test database required");
process.env.SESSION_SECRET = "integration-only-resource-test-secret-123";
process.env.NODE_ENV = "test";
process.env.COOKIE_SECURE = "false";
const { createApp } = await import("../../src/app.js");
const { pool } = await import("../../src/core/db.js");
let server: any, base: string, a: any, other: any;
async function req(
  method: string,
  path: string,
  body?: any,
  s = a,
  version?: number,
  key?: string,
): Promise<any> {
  const r = await fetch(base + "/api/v1" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(s ? { Cookie: s.cookie, "X-CSRF-Token": s.csrf } : {}),
      ...(version ? { "If-Match": JSON.stringify(String(version)) } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload=await r.json();
  if(r.status===200) (await import("../contracts.js")).checkResponse(method,path,payload);
  return {
    status: r.status,
    ...payload,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
async function ok(
  method: string,
  path: string,
  body?: any,
  s = a,
  version?: number,
  key?: string,
) {
  const r = await req(method, path, body, s, version, key);
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
}
async function register() {
  const csrf = await req("GET", "/auth/csrf", undefined, null);
  const suffix = randomUUID();
  const r = await req(
    "POST",
    "/auth/register",
    {
      companyName: "Resources",
      fullName: "Owner",
      login: "owner-" + suffix,
      email: suffix + "@example.com",
      password: "Resource-test-password-123",
    },
    { cookie: csrf.cookie, csrf: csrf.data.csrfToken },
  );
  assert.equal(r.status, 200, JSON.stringify(r));
  return { cookie: r.cookie, csrf: r.data.csrfToken, ...r.data };
}
async function person(name: string, s = a, contacts: any[] = []) {
  return ok("POST", "/people", { branchId: s.branchId, name, contacts }, s);
}
async function student(name: string, s = a) {
  const p = await person(name, s);
  const payer = await ok("POST", "/payers", { personId: p.id }, s);
  return ok("POST", "/students", { personId: p.id, payerId: payer.id }, s);
}
async function group(capacity = 1) {
  const p = await person("Teacher");
  const t = await ok("POST", "/staff", {
    personId: p.id,
    subject: "Math",
    rate: "100",
  });
  return ok("POST", "/groups", {
    name: "Group",
    branchId: a.branchId,
    teacherId: t.id,
    subject: "Math",
    capacity,
  });
}
before(async () => {
  await pool.execute("DELETE FROM crm_auth_limits");
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
  a = await register();
  other = await register();
});
after(async () => {
  await new Promise<void>((r) => server.close(() => r()));
  await pool.end();
});
test("contacts conflict atomically; explicit person gains multiple roles", async () => {
  const p = await person("Shared", a, [
    { kind: "email", value: " USER@EXAMPLE.COM " },
    { kind: "phone", value: "8 (999) 123-45-67" },
  ]);
  const c = await ok("GET", `/people/${p.id}/contacts`);
  assert.equal(c.find((x: any) => x.kind === "phone").value, "+79991234567");
  const dup = await req("POST", "/people", {
    branchId: a.branchId,
    name: "Duplicate",
    contacts: [{ kind: "email", value: "user@example.com" }],
  });
  assert.equal(dup.status, 409);
  assert.equal(dup.error.code, "CONTACT_EXISTS");
  const pay = await ok("POST", "/payers", { personId: p.id });
  const st = await ok("POST", "/students", { personId: p.id, payerId: pay.id });
  await ok("POST", "/staff", { personId: p.id, subject: "Math", rate: "0" });
  assert.equal((await ok("GET", `/students/${st.id}`)).person_id, p.id);
  const p2 = await person("Other");
  const failed = await req(
    "PATCH",
    `/people/${p2.id}`,
    { name: "Changed", contacts: [{ kind: "phone", value: "+79991234567" }] },
    a,
    1,
  );
  assert.equal(failed.status, 409);
  assert.equal((await ok("GET", `/people/${p2.id}`)).name, "Other");
  await assert.rejects(
    pool.execute(
      "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) SELECT UUID(),org_id,person_id,kind,value FROM crm_contacts WHERE person_id=? LIMIT 1",
      [p.id],
    ),
    (e: any) => e.code === "ER_DUP_ENTRY",
  );
});
test("parallel edits use compare-and-swap and failed edit adds no history", async () => {
  const p = await person("Versioned");
  const results = await Promise.all([
    req("PATCH", `/people/${p.id}`, { name: "A" }, a, 1),
    req("PATCH", `/people/${p.id}`, { name: "B" }, a, 1),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await ok("GET", `/people/${p.id}`)).version, 2);
  assert.equal((await ok("GET", `/people/${p.id}/history`)).total, 2);
  assert.equal(
    (await req("PATCH", `/people/${p.id}`, { name: "C" })).error.code,
    "VERSION_REQUIRED",
  );
  const comment = await ok("POST", `/people/${p.id}/comments`, {
    text: "Note",
  });
  assert.ok(comment.author_id);
  assert.ok(comment.created_at);
  assert.equal((await ok("GET", `/people/${p.id}`)).version, 2);
});
test("concurrent last-seat enrollment, leave and re-enroll retain periods", async () => {
  const g = await group();
  const s1 = await student("S1"),
    s2 = await student("S2");
  const results = await Promise.all(
    [s1, s2].map((s) =>
      req("POST", `/groups/${g.id}/members`, {
        studentId: s.id,
        startsAt: "2026-01-01T00:00:00Z",
      }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const list = await ok("GET", `/groups/${g.id}/members`);
  assert.equal(list.total, 1);
  const member = list.items[0];
  assert.ok(member.starts_at);
  const card = await ok("GET", `/groups/${g.id}`);
  await ok(
    "DELETE",
    `/groups/${g.id}/members/${member.student_id}`,
    undefined,
    a,
    card.version,
  );
  await ok("POST", `/groups/${g.id}/members`, { studentId: member.student_id });
  const periods = await ok("GET", `/groups/${g.id}/members`);
  assert.equal(periods.total, 2);
  assert.ok(periods.items.some((m: any) => m.ends_at));
  const current = await ok("GET", `/groups/${g.id}`);
  await ok("POST", `/groups/${g.id}/archive`, {}, a, current.version);
  assert.equal((await ok("GET", `/groups/${g.id}/members`)).total, 2);
  assert.equal(
    (await req("POST", `/groups/${g.id}/members`, { studentId: s2.id })).status,
    409,
  );
});
test("nonoverlapping future periods share a seat and overlap cannot bypass capacity", async () => {
  const g = await group();
  const s = await student("Scheduled"),
    t = await student("Scheduled2");
  const first = await ok("POST", "/enrollments", {
    groupId: g.id,
    studentId: s.id,
    startsAt: "2030-01-01T00:00:00Z",
    endsAt: "2030-02-01T00:00:00Z",
  });
  await ok("POST", "/enrollments", {
    groupId: g.id,
    studentId: t.id,
    startsAt: "2030-02-01T00:00:00Z",
    endsAt: null,
  });
  const overlap = await req(
    "PATCH",
    `/enrollments/${first.id}`,
    { startsAt: "2030-01-01T00:00:00Z", endsAt: "2030-03-01T00:00:00Z" },
    a,
    1,
  );
  assert.equal(overlap.status, 409);
});
test("lead selection, stage history, explicit repeat-safe conversion and no fake payment", async () => {
  const p = await person("Prospect");
  const lead = await ok("POST", "/leads", { personId: p.id });
  await ok(
    "PATCH",
    `/leads/${lead.id}`,
    { status: "Получена оплата", source: "", comment: "", responsibleId: null },
    a,
    1,
  );
  assert.equal((await ok("GET", `/leads/${lead.id}`)).student_id, null);
  const converted = await ok(
    "POST",
    `/leads/${lead.id}/convert`,
    {},
    a,
    2,
    randomUUID(),
  );
  const repeat = await ok(
    "POST",
    `/leads/${lead.id}/convert`,
    {},
    a,
    3,
    randomUUID(),
  );
  assert.equal(repeat.studentId, converted.studentId);
  assert.equal(repeat.payerId, converted.payerId);
  const another = await person("Wrong target");
  assert.equal(
    (
      await req(
        "POST",
        `/leads/${lead.id}/convert`,
        { studentPersonId: another.id },
        a,
        4,
        randomUUID(),
      )
    ).status,
    409,
  );
  const history = await ok("GET", `/leads/${lead.id}/history`);
  assert.ok(
    history.items.some(
      (h: any) =>
        h.before_data?.status === "Не разобран" &&
        h.after_data.status === "Получена оплата",
    ),
  );
  const [ledger]: any = await pool.execute(
    "SELECT COUNT(*) n FROM crm_ledger WHERE account_id=?",
    [converted.payerId],
  );
  assert.equal(Number(ledger[0].n), 0);
});
test("cross-tenant links are rejected in API and composite foreign keys", async () => {
  const foreign = await student("Foreign", other),
    local = await student("Local");
  const g = await group();
  assert.equal(
    (await req("POST", `/groups/${g.id}/members`, { studentId: foreign.id }))
      .status,
    404,
  );
  const p = await person("Payer");
  const payer = await ok("POST", "/payers", { personId: p.id });
  assert.equal(
    (
      await req("POST", "/payer-students", {
        payerId: payer.id,
        studentId: foreign.id,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await req("POST", "/tasks", {
        branchId: a.branchId,
        name: "Foreign",
        date: "2030-01-01",
        studentId: foreign.id,
      })
    ).status,
    404,
  );
  const lead = await ok("POST", "/leads", { personId: p.id });
  const foreignCard = await ok(
    "GET",
    `/students/${foreign.id}`,
    undefined,
    other,
  );
  assert.equal(
    (
      await req(
        "POST",
        `/leads/${lead.id}/convert`,
        { studentPersonId: foreignCard.person_id },
        a,
        1,
        randomUUID(),
      )
    ).status,
    404,
  );
  const localCard = await ok("GET", `/students/${local.id}`);
  await assert.rejects(
    pool.execute(
      "INSERT INTO crm_payer_students(id,org_id,branch_id,payer_id,student_id) VALUES(UUID(),?,?,?,?)",
      [localCard.org_id, a.branchId, payer.id, foreign.id],
    ),
    (e: any) => e.code === "ER_NO_REFERENCED_ROW_2",
  );
});
test("lists limit pagination, allowlisted sort/filter, archive and legal entity uniqueness", async () => {
  assert.equal((await req("GET", "/people?pageSize=101")).status, 400);
  assert.equal((await req("GET", "/people?sortBy=password_hash")).status, 400);
  assert.equal(
    (await req("GET", "/people?studentId=" + randomUUID())).status,
    400,
  );
  const page = await ok(
    "GET",
    "/people?q=Shared&sortBy=name&sortOrder=desc&pageSize=1",
  );
  assert.equal(page.items.length, 1);
  assert.equal(page.total, 1);
  const company = {
    branchId: a.branchId,
    name: "Company",
    inn: "1234567890",
    phone: "8 (999) 765-43-21",
  };
  const c = await ok("POST", "/companies", company);
  assert.equal((await ok("GET", `/companies/${c.id}`)).phone, "+79997654321");
  assert.equal((await req("POST", "/companies", company)).status, 409);
  await ok("POST", `/companies/${c.id}/archive`, {}, a, 1);
  assert.equal((await ok("GET", "/companies?archived=only")).total, 1);
});
test("task assignee and linked objects obey branch and teacher visibility", async () => {
  const p = await person("Assignee");
  const staff = await ok("POST", "/staff", {
    personId: p.id,
    subject: "Math",
    rate: "0",
  });
  await ok("POST", "/users", {
    personId: p.id,
    login: "teacher-" + randomUUID(),
    password: "Teacher-test-password-123",
    roles: ["teacher"],
    branchIds: [a.branchId],
  });
  const unrelated = await student("Not taught");
  const denied = await req("POST", "/tasks", {
    branchId: a.branchId,
    name: "Private child",
    date: "2030-01-01",
    responsibleId: staff.id,
    studentId: unrelated.id,
  });
  assert.equal(denied.status, 404);
  const task = await ok("POST", "/tasks", {
    branchId: a.branchId,
    name: "Preparation",
    date: "2030-01-01",
    responsibleId: staff.id,
    priority: "Высокий",
  });
  const changed = await ok(
    "PATCH",
    `/tasks/${task.id}`,
    {
      branchId: a.branchId,
      name: "Preparation 2",
      date: "2030-01-02",
      responsibleId: staff.id,
      status: "В работе",
    },
    a,
    1,
  );
  assert.equal(changed.version, 2);
  assert.equal(
    (
      await req(
        "PATCH",
        `/tasks/${task.id}/status`,
        { status: "Выполнена" },
        a,
        1,
      )
    ).status,
    409,
  );
  const foreignPerson = await person("Foreign assignee", other);
  const foreignStaff = await ok(
    "POST",
    "/staff",
    { personId: foreignPerson.id, subject: "Math", rate: "0" },
    other,
  );
  assert.equal(
    (
      await req("POST", "/tasks", {
        branchId: a.branchId,
        name: "Wrong staff",
        date: "2030-01-01",
        responsibleId: foreignStaff.id,
      })
    ).status,
    404,
  );
});
test("resource cards support editing, comments, history and archival", async () => {
  const b = await ok("POST", "/branches", { name: "Archive branch" });
  const room = await ok("POST", "/rooms", {
    branchId: b.id,
    name: "Room",
    capacity: 2,
  });
  await ok(
    "PATCH",
    `/rooms/${room.id}`,
    { branchId: b.id, name: "Updated room", capacity: 3 },
    a,
    1,
  );
  const p = await person("Archive role");
  const payer = await ok("POST", "/payers", { personId: p.id });
  const s = await ok("POST", "/students", {
    personId: p.id,
    payerId: payer.id,
  });
  await ok("PATCH", `/payers/${payer.id}`, { comment: "Notes" }, a, 1);
  const p2 = await person("Second payer");
  const payer2 = await ok("POST", "/payers", { personId: p2.id });
  const link = await ok("POST", "/payer-students", {
    payerId: payer2.id,
    studentId: s.id,
    relationship: "Parent",
  });
  await ok(
    "PATCH",
    `/payer-students/${link.id}`,
    { relationship: "Guardian" },
    a,
    1,
  );
  await ok("POST", `/payer-students/${link.id}/archive`, {}, a, 2);
  const mainLink = (await ok("GET", `/payer-students?studentId=${s.id}`))
    .items[0];
  assert.equal(
    (
      await req(
        "POST",
        `/payer-students/${mainLink.id}/archive`,
        {},
        a,
        mainLink.version,
      )
    ).error.code,
    "PRIMARY_PAYER",
  );
  for (const [resource, cardId] of [
    ["rooms", room.id],
    ["payers", payer.id],
    ["students", s.id],
  ]) {
    await ok("POST", `/${resource}/${cardId}/comments`, {
      text: "Internal comment",
    });
    assert.equal((await ok("GET", `/${resource}/${cardId}/comments`)).total, 1);
    assert.ok((await ok("GET", `/${resource}/${cardId}/history`)).total >= 1);
    const card = await ok("GET", `/${resource}/${cardId}`);
    await ok("POST", `/${resource}/${cardId}/archive`, {}, a, card.version);
    assert.ok((await ok("GET", `/${resource}/${cardId}`)).archived_at);
  }
  await ok("POST", `/branches/${b.id}/archive`, {}, a, 1);
  assert.equal(
    (
      await req("POST", "/rooms", {
        branchId: b.id,
        name: "Impossible",
        capacity: 1,
      })
    ).status,
    409,
  );
  assert.equal((await ok("GET", "/lead-stages")).length, 6);
  assert.equal((await ok("GET", "/pipeline")).stages.length, 6);
});
test("name-only patch preserves normalized contacts and increments derived card versions", async () => {
  const p = await person("Before", a, [
    { kind: "email", value: "preserve@example.com" },
  ]);
  const lead = await ok("POST", "/leads", { personId: p.id });
  await ok("PATCH", `/people/${p.id}`, { name: "After" }, a, 1);
  assert.equal(
    (await ok("GET", `/people/${p.id}/contacts`))[0].value,
    "preserve@example.com",
  );
  assert.equal((await ok("GET", `/leads/${lead.id}`)).version, 2);
  assert.equal((await ok("GET", `/leads/${lead.id}/history`)).total, 2);
});
test("capacity reduction races enrollment without exceeding the final capacity", async () => {
  const g = await group(2);
  const s1 = await student("Race1"),
    s2 = await student("Race2");
  await ok("POST", `/groups/${g.id}/members`, { studentId: s1.id });
  const card = await ok("GET", `/groups/${g.id}`);
  const r = await Promise.all([
    req(
      "PATCH",
      `/groups/${g.id}`,
      {
        branchId: a.branchId,
        teacherId: card.teacher_id,
        name: card.name,
        subject: card.subject,
        capacity: 1,
      },
      a,
      card.version,
    ),
    req("POST", `/groups/${g.id}/members`, { studentId: s2.id }),
  ]);
  assert.deepEqual(r.map((x) => x.status).sort(), [200, 409]);
  const final = await ok("GET", `/groups/${g.id}`);
  assert.ok(
    (await ok("GET", `/groups/${g.id}/members`)).total <= final.capacity,
  );
});
test("organization settings are versioned and archive makes tenant read-only", async () => {
  const org = await ok("GET", "/organization", undefined, other);
  await ok(
    "PATCH",
    "/organization",
    { name: "Renamed", timezone: org.timezone, settings: {} },
    other,
    org.version,
  );
  assert.equal(
    (
      await req(
        "PATCH",
        "/organization",
        { name: "Stale", timezone: org.timezone, settings: {} },
        other,
        org.version,
      )
    ).status,
    409,
  );
  await ok("POST", "/organization/comments", { text: "Closing beta" }, other);
  await ok("POST", "/organization/archive", {}, other, org.version + 1);
  assert.equal(
    (await ok("GET", "/organization/history", undefined, other)).total,
    2,
  );
  assert.equal(
    (
      await req(
        "POST",
        "/people",
        { branchId: other.branchId, name: "Blocked" },
        other,
      )
    ).status,
    409,
  );
});
