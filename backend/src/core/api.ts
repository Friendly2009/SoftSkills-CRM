import { beforeWrite, afterWrite, needsVersion } from "./records.js";
import { redactSecrets } from "./logger.js";
import type { Express, Request } from "express";
import { z } from "zod";
import { randomUUID, createHash } from "node:crypto";
import { transaction, rows, type DB } from "./db.js";
import { actor, type Actor, audit } from "./security.js";
import { assert } from "./errors.js";
import { responseData } from "./responseSchemas.js";
import { json, id } from "./validation.js";
export type Context = { db: DB; actor: Actor; requestId: string; req: Request };
export const definitions: Record<string, any> = {};
const resultSchema = {
  type: "object",
  required: ["data", "requestId"],
  properties: { data: {}, requestId: { type: "string", format: "uuid" } },
};
export function document(
  method: string,
  path: string,
  schema: z.ZodType | undefined,
  query: z.ZodType | undefined,
  summary: string,
  auth = true,
  idem = false,
) {
  const openPath = "/api/v1" + path.replace(/:([A-Za-z]+)/g, "{$1}");
  const parameters: any[] = [...path.matchAll(/:([A-Za-z]+)/g)].map((m) => ({
    in: "path",
    name: m[1],
    required: true,
    schema: { type: "string", format: "uuid" },
  }));
  if (query) {
    const s = z.toJSONSchema(query, { io: "input" }) as any;
    for (const [name, value] of Object.entries(s.properties ?? {}))
      parameters.push({
        in: "query",
        name,
        required: (s.required ?? []).includes(name),
        schema: value,
      });
  }
  if ((auth || path.startsWith("/auth/")) && method !== "get")
    parameters.push({
      in: "header",
      name: "X-CSRF-Token",
      required: true,
      schema: { type: "string" },
    });
  if (needsVersion(method, path))
    parameters.push({
      in: "header",
      name: "If-Match",
      required: true,
      schema: { type: "string", pattern: '^"[1-9][0-9]*"$' },
      description:
        "Current card version in double quotes. Stale versions return 409.",
    });
  if (idem)
    parameters.push({
      in: "header",
      name: "Idempotency-Key",
      required: true,
      schema: { type: "string", minLength: 8, maxLength: 128, pattern: "^[\\w.:-]+$" },
    });
  definitions[openPath] ??= {};
  definitions[openPath][method] = {
    summary,
    security: auth
      ? [{ sessionCookie: [] }]
      : method === "post" && path.startsWith("/auth/")
        ? [{ preCsrfCookie: [] }]
        : [],
    parameters,
    ...(schema
      ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: z.toJSONSchema(schema, { io: "input" }),
              },
            },
          },
        }
      : {}),
    responses: {
      "200": {
        description: "Success",
        ...(path.startsWith("/auth/") || path === "/profile/password" ? {headers: {"Set-Cookie": {description: "HttpOnly crm_session or crm_precsrf; Path=/api/v1, SameSite from config; Secure required in production. Logout/password change clears the session cookie.",schema:{type:"string"}}}} : {}),
        content: {
          "application/json": {
            schema: {
              ...resultSchema,
              properties: {
                ...resultSchema.properties,
                data: responseData(method, path),
              },
            },
          },
        },
      },
      ...Object.fromEntries(
        [400, 401, 403, 404, 409, 413, 415, 429, 500, 503].map((c) => [
          c,
          {
            description: "Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        ]),
      ),
    },
  };
}
export function route(
  app: Express,
  method: "get" | "post" | "patch" | "delete",
  path: string,
  options: {
    body?: z.ZodType;
    query?: z.ZodType;
    summary: string;
    idem?: boolean;
  },
  handler: (c: Context, body: any, query: any) => Promise<any>,
) {
  document(
    method,
    path,
    options.body,
    options.query,
    options.summary,
    true,
    options.idem,
  );
  app[method]("/api/v1" + path, async (req, res) => {
    const initial = res.locals.actor as Actor | undefined;
    assert(initial, 401, "UNAUTHENTICATED", "Sign in required");
    for (const val of Object.values(req.params)) id.parse(val);
    const body = options.body ? options.body.parse(req.body) : undefined;
    const query = options.query ? options.query.parse(req.query) : undefined;
    const key = options.idem
      ? z
          .string()
          .min(8)
          .max(128)
          .regex(/^[\w.:-]+$/)
          .parse(req.get("Idempotency-Key"))
      : undefined;
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify([
          initial.id,
          initial.roles,
          initial.branches,
          method,
          path,
          req.params,
          body,
        ]),
      )
      .digest("hex");
    const data = await transaction(initial.org, async (db) => {
      const current = (
        await rows(
          db,
          "SELECT u.* FROM crm_users u JOIN crm_memberships m ON m.user_id=u.id AND m.org_id=u.org_id JOIN crm_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP(3) AND u.active=TRUE",
          [res.locals.sessionHash],
        )
      )[0];
      assert(current, 401, "UNAUTHENTICATED", "Session expired");
      const a = actor(current);
      if (key) {
        const cached = (
          await rows(
            db,
            "SELECT * FROM crm_idempotency WHERE org_id=? AND key_value=?",
            [a.org, key],
          )
        )[0];
        if (cached) {
          assert(
            cached.request_hash === requestHash,
            409,
            "IDEMPOTENCY_CONFLICT",
            "Key was used for a different request",
          );
          return json(cached.response);
        }
      }
      const context = { db, actor: a, requestId: res.locals.requestId, req };
      if (method !== "get" && !["/auth/logout", "/auth/sessions/revoke-others", "/profile/password"].includes(path)) {
        const org = (
          await rows(
            db,
            "SELECT archived_at FROM crm_organizations WHERE id=?",
            [a.org],
          )
        )[0];
        assert(
          !org?.archived_at,
          409,
          "ORGANIZATION_ARCHIVED",
          "Organization is archived",
        );
      }
      const lessonMutation =
        method !== "get" && path.startsWith("/lessons") && path !== "/lessons";
      if (lessonMutation)
        await saveLessonVersion(context, String(req.params.id));
      const state = await beforeWrite(context, method, path);
      let output = await handler(context, body, query);
      output = await afterWrite(context, path, state, output);
      if (method !== "get" && path.startsWith("/lessons"))
        await saveLessonVersion(context, String(output.id));
      if (method !== "get") {
        const safe = body
          ? Object.fromEntries(
              Object.entries(body).filter(
                ([key]) =>
                  !["password", "currentPassword", "fileBase64"].includes(key),
              ),
            )
          : {};
        await audit(
          db,
          a,
          method,
          path,
          String(req.params.id ?? output?.id ?? ""),
          res.locals.requestId,
          { input: redactSecrets(safe) },
        );
      }
      if (key)
        await db.execute(
          "INSERT INTO crm_idempotency(id,org_id,key_value,request_hash,response) VALUES(?,?,?,?,?)",
          [randomUUID(), a.org, key, requestHash, JSON.stringify(output)],
        );
      return output;
    });
    if (path === "/auth/logout" || path === "/profile/password")
      res.clearCookie("crm_session", { path: "/api/v1" });
    res.json({ data, requestId: res.locals.requestId });
  });
}
export function openapi() {
  return {
    openapi: "3.1.0",
    info: { title: "SoftSkills CRM API", version: "1.0.0" },
    paths: {
      ...definitions,
      "/api/v1/openapi.json": {
        get: {
          summary: "Public OpenAPI contract", security: [],
          responses: { "200": { description: "OpenAPI 3.1 document", content: {
            "application/json": { schema: {
              type: "object", required: ["openapi", "info", "paths", "components"],
              properties: { openapi: {type:"string"}, info: {type:"object"}, paths: {type:"object"}, components: {type:"object"} }
            } }
          } } }
        }
      },
      ...Object.fromEntries(
        ["live", "ready"].map((name) => [
          "/health/" + name,
          {
            get: {
              summary:
                name === "live"
                  ? "Process liveness"
                  : "Database and schema readiness",
              security: [],
              responses: {
                "200": {
                  description: "Healthy",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["status", "requestId"],
                        properties: {
                          status: { type: "string" },
                          requestId: { type: "string", format: "uuid" },
                        },
                      },
                    },
                  },
                },
                ...(name === "ready"
                  ? { "503": { description: "Database or schema unavailable", content: {"application/json":{schema:{$ref:"#/components/schemas/Error"}}} } }
                  : {}),
              },
            },
          },
        ]),
      ),
    },
    components: {
      securitySchemes: {
        sessionCookie: { type: "apiKey", in: "cookie", name: "crm_session" },
        preCsrfCookie: { type: "apiKey", in: "cookie", name: "crm_precsrf" },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error", "requestId"],
          properties: {
            requestId: { type: "string" },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {},
              },
            },
          },
        },
      },
    },
  };
}

async function saveLessonVersion(c: Context, lessonId: string) {
  const lesson = (
    await rows(c.db, "SELECT * FROM crm_lessons WHERE org_id=? AND id=?", [
      c.actor.org,
      lessonId,
    ])
  )[0];
  if (!lesson) return;
  const attendees = await rows(
    c.db,
    "SELECT * FROM crm_attendees WHERE org_id=? AND lesson_id=? ORDER BY student_id",
    [c.actor.org, lessonId],
  );
  await c.db.execute(
    "INSERT IGNORE INTO crm_lesson_versions(id,org_id,lesson_id,revision,snapshot) VALUES(?,?,?,?,?)",
    [
      randomUUID(),
      c.actor.org,
      lessonId,
      lesson.revision,
      JSON.stringify({ lesson, attendees }),
    ],
  );
}
