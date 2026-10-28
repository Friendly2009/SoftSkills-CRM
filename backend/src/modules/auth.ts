import type { Express } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { transaction, rows } from "../core/db.js";
import { assert } from "../core/errors.js";
import { configuration } from "../core/config.js";
import {
  hashPassword,
  verifyPassword,
  token,
  digest,
  actor,
  audit,
  permit,
  get,
} from "../core/security.js";
import {
  text,
  email,
  password,
  phone,
  id,
  roles,
  json,
} from "../core/validation.js";
import { validateRoleLinks } from "./people.js";
import { document, route } from "../core/api.js";
const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.-]{3,100}$/);
const register = z
  .object({
    companyName: text,
    fullName: text,
    login,
    email,
    password,
    phone: phone.optional(),
  })
  .strict();
const signin = z
  .object({
    companySlug: z.string().min(1).max(80),
    login: z.string().trim().toLowerCase().min(1).max(254),
    password: z.string().min(1).max(128),
  })
  .strict();
export function authRoutes(app: Express) {
  const cfg = configuration();
  const cookie = {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: cfg.sameSite,
    path: "/api/v1",
    maxAge: 12 * 3600 * 1000,
  };
  document(
    "get",
    "/auth/csrf",
    undefined,
    undefined,
    "Bootstrap CSRF before login, registration or invitation acceptance",
    false,
  );
  app.get("/api/v1/auth/csrf", (_req, res) => {
    const value = token() + "." + Date.now();
    const csrfToken = value + "." + digest("precsrf:" + value, cfg.secret);
    res.cookie("crm_precsrf", csrfToken, { ...cookie, maxAge: 3600000 });
    res.json({ data: { csrfToken }, requestId: res.locals.requestId });
  });
  async function throttle(ip: string, identity: string) {
    await transaction(null, async (db) => {
      for (const value of [ip, identity]) {
        const bucket = digest("auth:" + value, cfg.secret);
        await db.execute(
          "INSERT INTO crm_auth_limits(bucket,attempts,expires_at) VALUES(?,1,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE attempts=IF(expires_at<UTC_TIMESTAMP(3),1,attempts+1),expires_at=IF(expires_at<UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),expires_at)",
          [bucket],
        );
        const count = (
          await rows(
            db,
            "SELECT attempts FROM crm_auth_limits WHERE bucket=?",
            [bucket],
          )
        )[0];
        // Commit attempts before rejecting below.
        if (Number(count?.attempts) > 30) return false;
      }
      return true;
    }).then((ok) =>
      assert(
        ok,
        429,
        "RATE_LIMIT",
        "Too many authentication attempts; retry in 15 minutes",
      ),
    );
  }
  async function createSession(db: any, userId: string) {
    const raw = token();
    const csrf = token();
    await db.execute(
      "INSERT INTO crm_sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 12 HOUR))",
      [digest(raw, cfg.secret), userId, csrf],
    );
    return { raw, csrf };
  }
  document(
    "post",
    "/auth/register",
    register,
    undefined,
    "Register organization and director",
    false,
  );
  app.post("/api/v1/auth/register", async (req, res) => {
    const b = register.parse(req.body);
    await throttle(req.ip ?? "unknown", "register:" + b.login);
    const passwordHash = await hashPassword(b.password);
    const result = await transaction(null, async (db) => {
      const org = randomUUID(),
        branch = randomUUID(),
        person = randomUUID(),
        user = randomUUID();
      const companySlug = "company-" + org;
      await db.execute(
        "INSERT INTO crm_organizations(id,name,settings,company_slug) VALUES(?,?,?,?)",
        [org, b.companyName, "{}", companySlug],
      );
      await db.execute(
        "INSERT INTO crm_branches(id,org_id,name) VALUES(?,?,?)",
        [branch, org, "Основной филиал"],
      );
      await db.execute(
        "INSERT INTO crm_people(id,org_id,branch_id,name,comment) VALUES(?,?,?,?,?)",
        [person, org, branch, b.fullName, ""],
      );
      await db.execute(
        "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
        [randomUUID(), org, person, "email", b.email],
      );
      await db.execute(
        "INSERT INTO crm_users(id,org_id,person_id,login,password_hash,roles,branches) VALUES(?,?,?,?,?,?,?)",
        [user, org, person, b.login, passwordHash, '["director"]', "[]"],
      );
      if (b.phone)
        await db.execute(
          "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,'phone',?)",
          [randomUUID(), org, person, b.phone],
        );
      await db.execute(
        "INSERT INTO crm_memberships(user_id,org_id) VALUES(?,?)",
        [user, org],
      );
      const a = {
        id: user,
        org,
        personId: person,
        roles: ["director"],
        branches: [],
      };
      await audit(db, a, "register", "organization", org, res.locals.requestId);
      return {
        companySlug,
        actor: a,
        branchId: branch,
        session: await createSession(db, user),
      };
    });
    res.cookie("crm_session", result.session.raw, cookie);
    res.json({
      data: {
        ...result.actor,
        companySlug: result.companySlug,
        branchId: result.branchId,
        csrfToken: result.session.csrf,
      },
      requestId: res.locals.requestId,
    });
  });
  document("post", "/auth/login", signin, undefined, "Sign in", false);
  app.post("/api/v1/auth/login", async (req, res) => {
    const b = signin.parse(req.body);
    await throttle(req.ip ?? "unknown", b.companySlug + ":" + b.login);
    const result = await transaction(null, async (db) => {
      const candidates = await rows(
        db,
        `SELECT u.* FROM crm_users u JOIN crm_memberships m ON m.user_id=u.id AND m.org_id=u.org_id
          JOIN crm_organizations o ON o.id=u.org_id WHERE o.company_slug=? AND
          (u.login=? OR EXISTS(SELECT 1 FROM crm_contacts c WHERE c.org_id=u.org_id AND c.person_id=u.person_id AND c.kind='email' AND c.value=?)) FOR UPDATE`,
        [b.companySlug, b.login, b.login],
      );
      const user = candidates.length === 1 ? candidates[0] : undefined;
      // Run scrypt for unknown users too, avoiding a cheap username timing oracle.
      const valid = await verifyPassword(
        b.password,
        user?.password_hash ??
          "scrypt$131072$00000000000000000000000000000000$" + "00".repeat(64),
      );
      assert(
        user && user.active && valid,
        401,
        "INVALID_CREDENTIALS",
        "Invalid login or password",
      );
      if (!user.password_hash.startsWith("scrypt$"))
        await db.execute("UPDATE crm_users SET password_hash=? WHERE id=?", [
          await hashPassword(b.password),
          user.id,
        ]);
      const a = actor(user);
      await audit(db, a, "login", "user", a.id, res.locals.requestId);
      return { actor: a, session: await createSession(db, user.id) };
    });
    res.cookie("crm_session", result.session.raw, cookie);
    res.json({
      data: {
        ...result.actor,
        companySlug: b.companySlug,
        csrfToken: result.session.csrf,
      },
      requestId: res.locals.requestId,
    });
  });
  const invitation = z
    .object({
      personId: id,
      roles,
      branchIds: z.array(id).max(100),
      expiresInHours: z.number().int().min(1).max(168).default(48),
    })
    .strict();
  route(
    app,
    "post",
    "/invitations",
    {
      body: invitation,
      summary: "Director creates single-use invitation; deliver token manually",
    },
    async (c, b) => {
      permit(c.actor, "director");
      await get(c.db, c.actor, "people", b.personId);
      assert(
        !(
          await rows(
            c.db,
            "SELECT id FROM crm_users WHERE org_id=? AND person_id=?",
            [c.actor.org, b.personId],
          )
        ).length,
        409,
        "ACCOUNT_EXISTS",
        "Person already has an account",
      );
      for (const br of b.branchIds) await get(c.db, c.actor, "branches", br);
      await validateRoleLinks(c, b.personId, b.roles);
      const raw = token(),
        invitationId = randomUUID();
      await c.db.execute(
        "UPDATE crm_invitations SET used_at=UTC_TIMESTAMP(3) WHERE org_id=? AND person_id=? AND used_at IS NULL",
        [c.actor.org, b.personId],
      );
      await c.db.execute(
        "INSERT INTO crm_invitations(id,org_id,person_id,token_hash,roles,branches,expires_at) VALUES(?,?,?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL ? HOUR))",
        [
          invitationId,
          c.actor.org,
          b.personId,
          digest(raw, cfg.secret),
          JSON.stringify(b.roles),
          JSON.stringify(b.branchIds),
          b.expiresInHours,
        ],
      );
      return { id: invitationId, token: raw, expiresInHours: b.expiresInHours };
    },
  );
  const accept = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/), login, password })
    .strict();
  document(
    "post",
    "/auth/invitations/accept",
    accept,
    undefined,
    "Accept unexpired invitation once",
    false,
  );
  app.post("/api/v1/auth/invitations/accept", async (req, res) => {
    const b = accept.parse(req.body);
    await throttle(
      req.ip ?? "unknown",
      "invite:" + digest(b.token, cfg.secret),
    );
    const tokenHash = digest(b.token, cfg.secret);
    const found = await transaction(
      null,
      async (db) =>
        (
          await rows(
            db,
            "SELECT org_id FROM crm_invitations WHERE token_hash=?",
            [tokenHash],
          )
        )[0],
    );
    assert(found, 400, "INVALID_INVITATION", "Invitation invalid or expired");
    const passwordHash = await hashPassword(b.password);
    const result = await transaction(found.org_id, async (db) => {
      const inv = (
        await rows(
          db,
          "SELECT * FROM crm_invitations WHERE token_hash=? AND used_at IS NULL AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE",
          [tokenHash],
        )
      )[0];
      assert(inv, 400, "INVALID_INVITATION", "Invitation invalid or expired");
      const organization = (await rows(db,
        "SELECT archived_at FROM crm_organizations WHERE id=?", [inv.org_id]))[0];
      assert(organization && !organization.archived_at, 400,
        "INVALID_INVITATION", "Invitation invalid or expired");
      for (const branchId of json(inv.branches)) {
        const branch = (await rows(db,
          "SELECT active,archived_at FROM crm_branches WHERE org_id=? AND id=?",
          [inv.org_id, branchId]))[0];
        assert(branch?.active && !branch.archived_at, 400,
          "INVALID_INVITATION", "Invitation invalid or expired");
      }
      const person = (
        await rows(
          db,
          "SELECT id FROM crm_people WHERE org_id=? AND id=? AND active=TRUE AND archived_at IS NULL",
          [inv.org_id, inv.person_id],
        )
      )[0];
      assert(
        person,
        400,
        "INVALID_INVITATION",
        "Invitation invalid or expired",
      );
      const userId = randomUUID();
      await db.execute(
        "INSERT INTO crm_users(id,org_id,person_id,login,password_hash,roles,branches) VALUES(?,?,?,?,?,?,?)",
        [
          userId,
          inv.org_id,
          inv.person_id,
          b.login,
          passwordHash,
          JSON.stringify(json(inv.roles)),
          JSON.stringify(json(inv.branches)),
        ],
      );
      await db.execute(
        "INSERT INTO crm_memberships(user_id,org_id) VALUES(?,?)",
        [userId, inv.org_id],
      );
      await db.execute(
        "UPDATE crm_invitations SET used_at=UTC_TIMESTAMP(3) WHERE org_id=? AND person_id=? AND used_at IS NULL",
        [inv.org_id, inv.person_id],
      );
      const a = actor({
        id: userId,
        org_id: inv.org_id,
        person_id: inv.person_id,
        roles: inv.roles,
        branches: inv.branches,
      });
      await audit(
        db,
        a,
        "accept_invitation",
        "user",
        userId,
        res.locals.requestId,
      );
      return {
        actor: a,
        companySlug: (
          await rows(
            db,
            "SELECT company_slug FROM crm_organizations WHERE id=?",
            [inv.org_id],
          )
        )[0]!.company_slug,
        session: await createSession(db, userId),
      };
    });
    res.cookie("crm_session", result.session.raw, cookie);
    res.json({
      data: {
        ...result.actor,
        companySlug: result.companySlug,
        csrfToken: result.session.csrf,
      },
      requestId: res.locals.requestId,
    });
  });
  route(
    app,
    "post",
    "/auth/sessions/revoke-others",
    {
      body: z.object({}).strict(),
      summary: "Revoke all sessions except current",
    },
    async (c) => {
      await c.db.execute(
        "DELETE FROM crm_sessions WHERE user_id=? AND token_hash<>?",
        [c.actor.id, digest(readCookie(c.req.headers.cookie), cfg.secret)],
      );
      return { revoked: true };
    },
  );
  route(
    app,
    "get",
    "/auth/me",
    { summary: "Current user and CSRF token" },
    async (c) => ({
      ...c.actor,
      companySlug: (
        await rows(
          c.db,
          "SELECT company_slug FROM crm_organizations WHERE id=?",
          [c.actor.org],
        )
      )[0]?.company_slug,
      csrfToken: (
        await rows(c.db, "SELECT csrf FROM crm_sessions WHERE token_hash=?", [
          digest(readCookie(c.req.headers.cookie), cfg.secret),
        ])
      )[0]?.csrf,
    }),
  );
  route(
    app,
    "post",
    "/auth/logout",
    { body: z.object({}).strict(), summary: "Revoke current session" },
    async (c) => {
      await c.db.execute("DELETE FROM crm_sessions WHERE token_hash=?", [
        digest(readCookie(c.req.headers.cookie), cfg.secret),
      ]);
      return { revoked: true };
    },
  );
}
export function readCookie(header: string | undefined) {
  return (
    header
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("crm_session="))
      ?.slice(12) ?? ""
  );
}
