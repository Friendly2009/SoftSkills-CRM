import type { Express, Response } from "express";
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
} from "../core/security.js";
import { text, email, password } from "../core/validation.js";
import { document, route } from "../core/api.js";
const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.@-]{3,100}$/);
const register = z
  .object({ organization: text, name: text, login, email, password })
  .strict();
const signin = z
  .object({ login, password: z.string().min(1).max(128) })
  .strict();
export function authRoutes(app: Express) {
  const cfg = configuration();
  const cookie = {
    httpOnly: true,
    secure: cfg.secure,
    sameSite: "lax" as const,
    path: "/api/v1",
    maxAge: 12 * 3600 * 1000,
  };
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
    await throttle(req.ip ?? "unknown", b.login);
    const passwordHash = await hashPassword(b.password);
    const result = await transaction(null, async (db) => {
      const org = randomUUID(),
        branch = randomUUID(),
        person = randomUUID(),
        user = randomUUID();
      await db.execute(
        "INSERT INTO crm_organizations(id,name,settings) VALUES(?,?,?)",
        [org, b.organization, "{}"],
      );
      await db.execute(
        "INSERT INTO crm_branches(id,org_id,name) VALUES(?,?,?)",
        [branch, org, "Основной филиал"],
      );
      await db.execute(
        "INSERT INTO crm_people(id,org_id,branch_id,name,comment) VALUES(?,?,?,?,?)",
        [person, org, branch, b.name, ""],
      );
      await db.execute(
        "INSERT INTO crm_contacts(id,org_id,person_id,kind,value) VALUES(?,?,?,?,?)",
        [randomUUID(), org, person, "email", b.email],
      );
      await db.execute(
        "INSERT INTO crm_users(id,org_id,person_id,login,password_hash,roles,branches) VALUES(?,?,?,?,?,?,?)",
        [user, org, person, b.login, passwordHash, '["director"]', "[]"],
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
        actor: a,
        branchId: branch,
        session: await createSession(db, user),
      };
    });
    res.cookie("crm_session", result.session.raw, cookie);
    res.json({
      data: {
        ...result.actor,
        branchId: result.branchId,
        csrfToken: result.session.csrf,
      },
      requestId: res.locals.requestId,
    });
  });
  document("post", "/auth/login", signin, undefined, "Sign in", false);
  app.post("/api/v1/auth/login", async (req, res) => {
    const b = signin.parse(req.body);
    await throttle(req.ip ?? "unknown", b.login);
    const result = await transaction(null, async (db) => {
      const user = (
        await rows(db, "SELECT * FROM crm_users WHERE login=? FOR UPDATE", [
          b.login,
        ])
      )[0];
      // Run scrypt for unknown users too, avoiding a cheap username timing oracle.
      const valid = await verifyPassword(
        b.password,
        user?.password_hash ??
          "00000000000000000000000000000000:" + "00".repeat(64),
      );
      assert(
        user && user.active && valid,
        401,
        "INVALID_CREDENTIALS",
        "Invalid login or password",
      );
      const a = actor(user);
      await audit(db, a, "login", "user", a.id, res.locals.requestId);
      return { actor: a, session: await createSession(db, user.id) };
    });
    res.cookie("crm_session", result.session.raw, cookie);
    res.json({
      data: { ...result.actor, csrfToken: result.session.csrf },
      requestId: res.locals.requestId,
    });
  });
  route(
    app,
    "get",
    "/auth/me",
    { summary: "Current user and CSRF token" },
    async (c) => ({
      ...c.actor,
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
