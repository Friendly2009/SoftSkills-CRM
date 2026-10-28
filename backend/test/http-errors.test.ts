import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../src/app.js";
test("unsupported charset and encoding are client errors, not server failures", async () => {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  try {
    for (const headers of [
      { "Content-Type": "application/json; charset=iso-8859-1" },
      { "Content-Type": "application/json", "Content-Encoding": "unsupported" },
    ]) {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/auth/login`, {
        method: "POST", headers: headers as Record<string, string>, body: "{}",
      });
      assert.equal(response.status, 415);
      assert.equal((await response.json()).error.code, "CONTENT_TYPE");
    }
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
