import { financeReportRoutes } from "./modules/financeReports.js";
import { cardRoutes } from "./modules/cards.js";
import { log } from "./core/logger.js";
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
    const started = Date.now();
    res.once("finish", () =>
      log({
        level: "info",
        event: "http",
        requestId: res.locals.requestId,
        method: req.method,
        route: req.route?.path ?? "unmatched",
        status: res.statusCode,
        durationMs: Date.now() - started,
      }),
    );
    res.set({
      "X-Request-Id": res.locals.requestId,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    const origin = req.get("origin");
    if (origin) {
      if (!cfg.origins.includes(origin))
        return next(
          new AppError(403, "ORIGIN_FORBIDDEN", "Origin not allowed"),
        );
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,X-CSRF-Token,Idempotency-Key,If-Match",
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
    try {
      await transaction(null, async (db) => {
        const migration = (
          await rows(
            db,
            "SELECT COUNT(*) AS n FROM crm_migrations WHERE name IN (?,?,?,?,?)",
            [
              "004_identity.sql",
              "005_resources.sql",
              "006_education.sql",
              "007_finance.sql",
              "008_import_preview.sql",
            ],
          )
        )[0];
        assert(
          Number(migration?.n) === 5,
          503,
          "MIGRATIONS_REQUIRED",
          "Run migrations",
        );
      });
    } catch {
      throw new AppError(
        503,
        "NOT_READY",
        "Database unavailable or migrations required",
      );
    }
    res.json({ status: "ready", requestId: res.locals.requestId });
  });
  app.get("/api/v1/openapi.json", (_, res) => res.json(openapi()));
  app.use("/api/v1", async (req, res, next) => {
    if (req.path === "/auth/csrf" && req.method === "GET") return next();
    if (
      ["/auth/login", "/auth/register", "/auth/invitations/accept"].includes(
        req.path,
      ) &&
      req.method === "POST"
    ) {
      const supplied = req.get("X-CSRF-Token") ?? "";
      const saved = req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("crm_precsrf="))
        ?.slice(12);
      const parts = supplied.split(".");
      const value = parts.slice(0, 2).join(".");
      assert(
        supplied === saved &&
          /^[a-f0-9]{64}$/.test(parts[0] ?? "") &&
          parts.length === 3 &&
          Number(parts[1]) <= Date.now() &&
          Date.now() - Number(parts[1]) < 3600000 &&
          parts[2] === digest("precsrf:" + value, cfg.secret),
        403,
        "CSRF",
        "Bootstrap /auth/csrf first",
      );
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
            "SELECT u.*,s.csrf FROM crm_sessions s JOIN crm_users u ON u.id=s.user_id JOIN crm_memberships m ON m.user_id=u.id AND m.org_id=u.org_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.active=TRUE",
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
  cardRoutes(app);
  educationRoutes(app);
  financeRoutes(app);
  financeReportRoutes(app);
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
      } else if (["charset.unsupported", "encoding.unsupported"].includes(err.type)) {
        status = 415;
        code = "CONTENT_TYPE";
        message = "Unsupported request charset or content encoding";
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
