import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (!process.env.DB_NAME?.endsWith("_test"))
  throw new Error("Use dedicated DB_NAME ending _test");
process.env.SESSION_SECRET = "integration-tests-only-32-characters-secret";
process.env.NODE_ENV = "test";
process.env.COOKIE_SECURE = "false";
process.env.APP_ORIGIN = "http://localhost:5173";
const { createApp } = await import("../../src/app.js");
const { pool } = await import("../../src/core/db.js");
let server: any, base: string;
const password = "A-long-test-password-123";
type Session = { cookie: string; csrf: string };
async function call(
  method: string,
  path: string,
  body?: any,
  session?: Session,
  extra: Record<string, string> = {},
) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session
        ? { Cookie: session.cookie, "X-CSRF-Token": session.csrf }
        : {}),
      ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await res.json();
  return {
    ...payload,
    status: res.status,
    cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "",
    headers: res.headers,
  };
}
async function boot(): Promise<Session> {
  const r = await call("GET", "/api/v1/auth/csrf");
  return { cookie: r.cookie, csrf: r.data.csrfToken };
}
async function publicPost(path: string, body: any) {
  return call("POST", "/api/v1" + path, body, await boot());
}
function session(r: any): Session {
  return { cookie: r.cookie, csrf: r.data.csrfToken };
}
async function register(overrides: any = {}) {
  const login = "owner-" + randomUUID().slice(0, 8);
  const r = await publicPost("/auth/register", {
    companyName: "Same company name",
    fullName: "Director",
    login,
    email: login + "@example.com",
    password,
    ...overrides,
  });
  assert.equal(r.status, 200, JSON.stringify(r));
  return { ...r, login, ...session(r) };
}
async function ok(method: string, path: string, body: any, s: Session) {
  const r = await call(method, "/api/v1" + path, body, s);
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
}
async function person(s: any, branch = s.data.branchId) {
  return (
    await ok(
      "POST",
      "/people",
      { branchId: branch, name: "Invited person", contacts: [] },
      s,
    )
  ).id;
}
before(async () => {
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
  const [v]: any = await pool.query("SELECT VERSION() AS v");
  assert.match(
    v[0].v,
    /^8\./,
    "Integration requires MySQL 8, not SQLite/MariaDB",
  );
});
beforeEach(async () => {
  await pool.execute("DELETE FROM crm_auth_limits");
});
after(async () => {
  await new Promise<void>((r) => server.close(r));
  await pool.end();
});
test("health and CSRF bootstrap: anonymous writes, forged tokens, origins and malformed JSON", async () => {
  assert.equal((await call("GET", "/health/live")).status, 200);
  assert.equal((await call("GET", "/health/ready")).status, 200);
  assert.equal((await call("POST", "/api/v1/auth/register", {})).status, 403);
  const b = await boot();
  assert.equal(
    (await call("POST", "/api/v1/auth/register", {}, { ...b, csrf: "forged" }))
      .status,
    403,
  );
  assert.equal(
    (
      await call("POST", "/api/v1/auth/register", {}, b, {
        Origin: "https://evil.example",
      })
    ).status,
    403,
  );
  const r = await call("GET", "/health/live", undefined, undefined, {
    Origin: "http://localhost:5173",
  });
  assert.equal(
    r.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  const malformed = await fetch(base + "/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
});
test("registration creates atomic tenant graph, normalized phone, membership; names and logins reusable across tenants", async () => {
  const login = "shared-" + randomUUID().slice(0, 8);
  const a = await register({
      login,
      email: login + "@example.com",
      phone: "8 (999) 123-45-67",
    }),
    b = await register({ login, email: login + "@example.com" });
  assert.notEqual(a.data.companySlug, b.data.companySlug);
  const [graph]: any = await pool.execute(
    "SELECT m.user_id,p.name,b.id AS branch FROM crm_memberships m JOIN crm_users u ON u.id=m.user_id JOIN crm_people p ON p.id=u.person_id JOIN crm_branches b ON b.id=p.branch_id WHERE m.org_id=?",
    [a.data.org],
  );
  assert.equal(graph.length, 1);
  const profile = await ok("GET", "/profile", undefined, a);
  assert.equal(
    profile.contacts.find((v: any) => v.kind === "phone").value,
    "+79991234567",
  );
  assert.equal("comment" in profile.person, false);
  for (const identity of [login, login + "@example.com"]) {
    const r = await publicPost("/auth/login", {
      companySlug: a.data.companySlug,
      login: identity,
      password,
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.org, a.data.org);
  }
  assert.equal(
    (
      await publicPost("/auth/login", {
        companySlug: "unknown",
        login,
        password,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await publicPost("/auth/register", {
        companyName: "X",
        fullName: "X",
        login: "owner",
        email: "x@example.com",
        password,
        phone: "123",
      })
    ).status,
    400,
  );
  // Force a late failure after inserts; all registration rows must roll back.
  const [clock]: any = await pool.query("SELECT UTC_TIMESTAMP(3) AS cutoff");
  await pool.query(
    "ALTER TABLE crm_memberships ADD CONSTRAINT test_membership_failure CHECK (created_at <= " +
      pool.escape(clock[0].cutoff) +
      ")",
  );
  try {
    const r = await publicPost("/auth/register", {
      companyName: "rollback-" + login,
      fullName: "X",
      login,
      email: login + "@example.com",
      password,
    });
    assert.equal(r.status, 500);
    const [left]: any = await pool.execute(
      "SELECT id FROM crm_organizations WHERE name=?",
      ["rollback-" + login],
    );
    assert.equal(left.length, 0);
  } finally {
    await pool.query(
      "ALTER TABLE crm_memberships DROP CHECK test_membership_failure",
    );
  }
});
test("session cookies, CSRF, logout, revoke others, profile and password change", async () => {
  const a = await register();
  assert.match(a.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(a.headers.get("set-cookie"), /SameSite=Lax/i);
  const login = async () => {
    const r = await publicPost("/auth/login", {
      companySlug: a.data.companySlug,
      login: a.login,
      password,
    });
    assert.equal(r.status, 200);
    return session(r);
  };
  const second = await login();
  assert.notEqual(second.cookie, a.cookie);
  assert.equal(
    (
      await call(
        "PATCH",
        "/api/v1/profile",
        { fullName: "New", email: "new@example.com" },
        { ...a, csrf: "" },
      )
    ).status,
    403,
  );
  await ok("POST", "/auth/sessions/revoke-others", {}, a);
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, second)).status,
    401,
  );
  await ok(
    "PATCH",
    "/profile",
    {
      fullName: "New name",
      email: "new-" + a.login + "@example.com",
      phone: "+44 7700 900123",
    },
    a,
  );
  assert.equal(
    (await ok("GET", "/profile", undefined, a)).person.fullName,
    "New name",
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/api/v1/profile",
        { fullName: "New", email: "new@example.com", roles: ["director"] },
        a,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "POST",
        "/api/v1/profile/password",
        { currentPassword: "wrong", password: "New-secure-password-123" },
        a,
      )
    ).status,
    403,
  );
  await ok(
    "POST",
    "/profile/password",
    { currentPassword: password, password: "New-secure-password-123" },
    a,
  );
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, a)).status,
    401,
  );
  assert.equal(
    (
      await publicPost("/auth/login", {
        companySlug: a.data.companySlug,
        login: a.login,
        password,
      })
    ).status,
    401,
  );
  const r = await publicPost("/auth/login", {
    companySlug: a.data.companySlug,
    login: a.login,
    password: "New-secure-password-123",
  });
  assert.equal(r.status, 200);
  const logout = await call("POST", "/api/v1/auth/logout", {}, session(r));
  assert.match(logout.headers.get("set-cookie")!, /Expires=Thu, 01 Jan 1970/);
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, session(r))).status,
    401,
  );
});
test("invitations are atomic, one-use, expiring, tenant and role checked", async () => {
  const a = await register(),
    b = await register(),
    p = await person(a);
  const foreignPerson = await person(b);
  assert.equal(
    (
      await call(
        "POST",
        "/api/v1/invitations",
        {
          personId: foreignPerson,
          roles: ["manager"],
          branchIds: [a.data.branchId],
        },
        a,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "POST",
        "/api/v1/invitations",
        { personId: p, roles: ["manager"], branchIds: [b.data.branchId] },
        a,
      )
    ).status,
    404,
  );
  const inv = await ok(
    "POST",
    "/invitations",
    { personId: p, roles: ["manager"], branchIds: [a.data.branchId] },
    a,
  );
  const [stored]: any = await pool.execute(
    "SELECT token_hash FROM crm_invitations WHERE id=?",
    [inv.id],
  );
  assert.notEqual(stored[0].token_hash, inv.token);
  const body = {
    token: inv.token,
    login: "invite-" + randomUUID().slice(0, 8),
    password,
  };
  const accepted = await Promise.all([
    publicPost("/auth/invitations/accept", body),
    publicPost("/auth/invitations/accept", body),
  ]);
  assert.deepEqual(accepted.map((r) => r.status).sort(), [200, 400]);
  const manager = session(accepted.find((r) => r.status === 200));
  assert.equal(
    (
      await call(
        "POST",
        "/api/v1/invitations",
        { personId: p, roles: ["director"], branchIds: [] },
        manager,
      )
    ).status,
    403,
  );
  assert.equal(
    (await publicPost("/auth/invitations/accept", body)).status,
    400,
  );
  const expired = await ok(
    "POST",
    "/invitations",
    { personId: await person(a), roles: ["manager"], branchIds: [] },
    a,
  );
  await pool.execute(
    "UPDATE crm_invitations SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE id=?",
    [expired.id],
  );
  assert.equal(
    (
      await publicPost("/auth/invitations/accept", {
        ...body,
        token: expired.token,
      })
    ).status,
    400,
  );
});
test("tenant, branch, role boundaries; blocking revokes all sessions; final director protected", async () => {
  const a = await register(),
    b = await register(),
    p = await person(a);
  const br = (await ok("POST", "/branches", { name: "Other branch" }, a)).id;
  const hidden = await person(a, br);
  const user = await ok(
    "POST",
    "/users",
    {
      personId: p,
      login: "manager",
      password,
      roles: ["manager"],
      branchIds: [a.data.branchId],
    },
    a,
  );
  const r = await publicPost("/auth/login", {
      companySlug: a.data.companySlug,
      login: "manager",
      password,
    }),
    m = session(r);
  assert.equal(r.status, 200);
  assert.equal(
    (await call("GET", "/api/v1/people/" + hidden, undefined, m)).status,
    404,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/api/v1/people/" + hidden,
        { name: "Hack", contacts: [] },
        m,
      )
    ).status,
    403,
  );
  assert.equal(
    (await call("GET", "/api/v1/people/" + b.data.personId, undefined, m))
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        "POST",
        "/api/v1/people",
        { branchId: b.data.branchId, name: "Hack" },
        a,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/api/v1/users/" + user.id,
        { roles: ["director"], branchIds: [], active: true },
        m,
      )
    ).status,
    403,
  );
  const last = await call(
    "PATCH",
    "/api/v1/users/" + a.data.id,
    { roles: ["director"], branchIds: [], active: false },
    a,
  );
  assert.equal(last.status, 409);
  assert.equal(last.error.code, "LAST_DIRECTOR");
  assert.equal(
    (await call("DELETE", "/api/v1/users/" + a.data.id, {}, a)).status,
    404,
  );
  await ok(
    "PATCH",
    "/users/" + user.id,
    { roles: ["manager"], branchIds: [], active: true },
    a,
  );
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, m)).status,
    401,
  );
  const empty = await publicPost("/auth/login", {
    companySlug: a.data.companySlug,
    login: "manager",
    password,
  });
  assert.equal(
    (await ok("GET", "/people", undefined, session(empty))).items.length,
    0,
  );
  await ok(
    "PATCH",
    "/users/" + user.id,
    { roles: ["manager"], branchIds: [a.data.branchId], active: false },
    a,
  );
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, session(empty))).status,
    401,
  );
  assert.equal(
    (
      await publicPost("/auth/login", {
        companySlug: a.data.companySlug,
        login: "manager",
        password,
      })
    ).status,
    401,
  );
});
test("authentication throttling persists in MySQL", async () => {
  const a = await register();
  await pool.execute("DELETE FROM crm_auth_limits");
  for (let i = 0; i < 30; i++)
    assert.equal(
      (
        await publicPost("/auth/login", {
          companySlug: a.data.companySlug,
          login: "unknown",
          password,
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await publicPost("/auth/login", {
        companySlug: a.data.companySlug,
        login: "unknown",
        password,
      })
    ).status,
    429,
  );
  assert.equal(
    (
      await publicPost("/auth/register", {
        companyName: "Limit",
        fullName: "X",
        login: "limited",
        email: "limit@example.com",
        password,
      })
    ).status,
    429,
  );
});
test("expired sessions, replaced invitations and concurrent director blocking", async () => {
  const a = await register();
  const p = await person(a);
  const inv = await ok(
    "POST",
    "/invitations",
    { personId: p, roles: ["director"], branchIds: [] },
    a,
  );
  const newer = await ok(
    "POST",
    "/invitations",
    { personId: p, roles: ["director"], branchIds: [] },
    a,
  );
  assert.equal(
    (
      await publicPost("/auth/invitations/accept", {
        token: inv.token,
        login: "director2",
        password,
      })
    ).status,
    400,
  );
  const accepted = await publicPost("/auth/invitations/accept", {
    token: newer.token,
    login: "director2",
    password,
  });
  assert.equal(accepted.status, 200);
  const b = session(accepted);
  const result = await Promise.all([
    call(
      "PATCH",
      "/api/v1/users/" + accepted.data.id,
      { roles: ["director"], branchIds: [], active: false },
      a,
    ),
    call(
      "PATCH",
      "/api/v1/users/" + a.data.id,
      { roles: ["director"], branchIds: [], active: false },
      b,
    ),
  ]);
  assert.equal(result.filter((r) => r.status === 200).length, 1);
  const [directors]: any = await pool.execute(
    `SELECT id FROM crm_users WHERE org_id=? AND active=TRUE AND JSON_CONTAINS(roles, '"director"')`,
    [a.data.org],
  );
  assert.equal(directors.length, 1);
  const remaining = directors[0].id === a.data.id ? a : b;
  await pool.execute(
    "UPDATE crm_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE user_id=?",
    [directors[0].id],
  );
  assert.equal(
    (await call("GET", "/api/v1/auth/me", undefined, remaining)).status,
    401,
  );
});
test("readiness fails when required migration is missing while liveness remains available", async () => {
  await pool.execute(
    "UPDATE crm_migrations SET name='004_temporarily_hidden' WHERE name='004_identity.sql'",
  );
  try {
    assert.equal((await call("GET", "/health/ready")).status, 503);
    assert.equal((await call("GET", "/health/live")).status, 200);
  } finally {
    await pool.execute(
      "UPDATE crm_migrations SET name='004_identity.sql' WHERE name='004_temporarily_hidden'",
    );
  }
});
