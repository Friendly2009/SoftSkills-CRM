import { redactSecrets } from "./logger.js";
import type { Express, Request, Response } from "express";
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
      parameters.push({ in: "query", name, schema: value });
  }
  if ((auth || path.startsWith("/auth/")) && method !== "get")
    parameters.push({
      in: "header",
      name: "X-CSRF-Token",
      required: true,
      schema: { type: "string" },
    });
  if (idem)
    parameters.push({
      in: "header",
      name: "Idempotency-Key",
      required: true,
      schema: { type: "string", minLength: 8, maxLength: 128 },
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
      const output = await handler(
        { db, actor: a, requestId: res.locals.requestId, req },
        body,
        query,
      );
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
                  ? { "503": { description: "Database or schema unavailable" } }
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
