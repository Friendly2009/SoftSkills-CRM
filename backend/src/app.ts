import express from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { configuration } from "./core/config.js";
import { transaction, rows } from "./core/db.js";
import { AppError, assert } from "./core/errors.js";
import { digest, actor } from "./core/security.js";
import { openapi } from "./core/api.js";
import { authRoutes, readCookie } from "./modules/auth.js";
import { peopleRoutes } from "./modules/people.js";
import { resourceRoutes } from "./modules/resources.js";
import { educationRoutes } from "./modules/education.js";
import { financeRoutes } from "./modules/finance.js";
import { salesRoutes } from "./modules/sales.js";
import { analyticsRoutes } from "./modules/analytics.js";
import { collaborationRoutes } from "./modules/collaboration.js";
import { importRoutes } from "./modules/imports.js";
export function createApp() {
  const cfg = configuration();
  const app = express();
  app.disable("x-powered-by");
  if (cfg.trustProxy) app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set({
      "X-Request-Id": res.locals.requestId,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    const origin = req.get("origin");
    if (origin) {
      if (origin !== cfg.origin)
        return next(
          new AppError(403, "ORIGIN_FORBIDDEN", "Origin not allowed"),
        );
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,X-CSRF-Token,Idempotency-Key",
      });
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use((req, res, next) => {
    if (
      ["POST", "PATCH", "PUT"].includes(req.method) &&
      !req.is("application/json")
    )
      return next(new AppError(415, "CONTENT_TYPE", "Use application/json"));
    next();
  });
  app.get("/health/live", (_, res) =>
    res.json({ status: "ok", requestId: res.locals.requestId }),
  );
  app.get("/health/ready", async (_, res) => {
    await transaction(null, async (db) => {
      const migration = (
        await rows(db, "SELECT name FROM crm_migrations WHERE name=?", [
          "003_preferences.sql",
        ])
      )[0];
      assert(migration, 503, "MIGRATIONS_REQUIRED", "Run migrations");
    });
    res.json({ status: "ready", requestId: res.locals.requestId });
  });
  app.get("/api/v1/openapi.json", (_, res) => res.json(openapi()));
  app.use("/api/v1", async (req, res, next) => {
    if (
      ["/auth/login", "/auth/register"].includes(req.path) &&
      req.method === "POST"
    ) {
      next();
      return;
    }
    const cookie = readCookie(req.headers.cookie);
    assert(
      /^[a-f0-9]{64}$/.test(cookie),
      401,
      "UNAUTHENTICATED",
      "Sign in required",
    );
    const hash = digest(cookie, cfg.secret);
    const session = await transaction(
      null,
      async (db) =>
        (
          await rows(
            db,
            "SELECT u.*,s.csrf FROM crm_sessions s JOIN crm_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.active=TRUE",
            [hash],
          )
        )[0],
    );
    assert(session, 401, "UNAUTHENTICATED", "Session expired");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method))
      assert(
        req.get("X-CSRF-Token") === session.csrf,
        403,
        "CSRF",
        "Invalid CSRF token",
      );
    res.locals.actor = actor(session);
    res.locals.sessionHash = hash;
    next();
  });
  authRoutes(app);
  peopleRoutes(app);
  resourceRoutes(app);
  educationRoutes(app);
  financeRoutes(app);
  salesRoutes(app);
  importRoutes(app);
  collaborationRoutes(app);
  analyticsRoutes(app);
  app.use((req, res) =>
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
      requestId: res.locals.requestId,
    }),
  );
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      let status = 500,
        code = "INTERNAL_ERROR",
        message = "Unexpected server error",
        details: unknown;
      if (err instanceof AppError) {
        ({ status, code, message, details } = err);
      } else if (err instanceof ZodError) {
        status = 400;
        code = "VALIDATION";
        message = "Invalid input";
        details = err.issues.map((i) => ({ path: i.path, message: i.message }));
      } else if (err.type === "entity.too.large") {
        status = 413;
        code = "BODY_TOO_LARGE";
        message = "Request body exceeds 1 MiB";
      } else if (err.type === "entity.parse.failed") {
        status = 400;
        code = "INVALID_JSON";
        message = "Malformed JSON";
      } else if (err.code === "ER_DUP_ENTRY") {
        status = 409;
        code = "DUPLICATE";
        message = "Unique value already exists";
      } else if (
        err.code === "ER_NO_REFERENCED_ROW_2" ||
        err.code === "ER_ROW_IS_REFERENCED_2"
      ) {
        status = 409;
        code = "REFERENCE_CONFLICT";
        message = "Invalid or referenced resource";
      } else if (
        ["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(err.code)
      ) {
        status = 503;
        code = "RETRY_TRANSACTION";
        message = "Transaction contention; retry with the same idempotency key";
      }
      if (status >= 500)
        console.error(
          JSON.stringify({
            level: "error",
            requestId: res.locals.requestId,
            code: err.code ?? err.name,
            message:
              err instanceof AppError
                ? err.message
                : "Internal dependency failure",
          }),
        );
      res.status(status).json({
        error: { code, message, ...(details ? { details } : {}) },
        requestId: res.locals.requestId,
      });
    },
  );
  return app;
}
