import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { configuration } from "../src/core/config.js";
import { redactSecrets } from "../src/core/logger.js";
import { branch } from "../src/core/security.js";
import { portalDTO } from "../src/modules/resources.js";
test("environment fails closed without leaking secret values", () => {
  const saved = { ...process.env };
  try {
    process.env.DB_PORT = "not-a-port";
    assert.throws(configuration, /DB_PORT/);
    process.env.DB_PORT = "3306";
    process.env.SESSION_SECRET = "secret";
    assert.throws(configuration, (e) => !String(e).includes("secret"));
    process.env.SESSION_SECRET = "unit-test-only-secret-32-characters";
    process.env.NODE_ENV = "production";
    process.env.APP_ORIGIN = "https://crm.example";
    process.env.COOKIE_SECURE = "false";
    assert.throws(configuration, /COOKIE_SECURE/);
    process.env.COOKIE_SECURE = "true";
    process.env.COOKIE_SAME_SITE = "none";
    process.env.CORS_ORIGINS = "https://portal.example";
    assert.deepEqual(configuration().origins, [
      "https://crm.example",
      "https://portal.example",
    ]);
    process.env.CORS_ORIGINS = "https://portal.example/path";
    assert.throws(configuration, /Origins/);
    process.env.CORS_ORIGINS = "*";
    assert.throws(configuration);
  } finally {
    for (const k of Object.keys(process.env))
      if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
  }
});
test("recursive secret redaction and portal DTO allowlists", () => {
  const data = redactSecrets({
    password: "value",
    nested: {
      currentPassword: "value",
      token: "value",
      authorization: "value",
    },
    requestId: "id",
  });
  assert.equal(JSON.stringify(data).includes("value"), false);
  assert.deepEqual(
    portalDTO("people", {
      id: "id",
      name: "Name",
      comment: "private",
      password_hash: "hash",
      future_secret: "hidden",
    }),
    { id: "id", name: "Name" },
  );
  assert.deepEqual(
    portalDTO("lessons", {
      id: "id",
      name: "Lesson",
      salary: "100",
      comment: "private",
    }),
    { id: "id", name: "Lesson" },
  );
});
test("empty staff branch list grants no branch access", () => {
  assert.throws(() =>
    branch(
      { id: "u", org: "o", personId: "p", roles: ["manager"], branches: [] },
      "branch",
    ),
  );
});
