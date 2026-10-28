import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
if (!process.env.DB_NAME?.endsWith("_test"))
  throw new Error("Dedicated MySQL _test database required");
async function freePort() {
  const s = createServer();
  s.listen(0, "127.0.0.1");
  await once(s, "listening");
  const port = (s.address() as any).port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}
function start(env: Record<string, string>) {
  const child = spawn(process.execPath, ["dist/server.js"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      COOKIE_SECURE: "false",
      SESSION_SECRET: "lifecycle-test-secret-32-characters",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (b) => (output += b));
  child.stderr.on("data", (b) => (output += b));
  const done = once(child, "exit");
  return { child, done, output: () => output };
}
test(
  "production cookies, HTTP lifecycle and graceful SIGTERM",
  { timeout: 20000 },
  async () => {
    const port = await freePort();
    const s = start({
      PORT: String(port),
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      APP_ORIGIN: "https://crm.example",
      COOKIE_SECURE: "true",
      COOKIE_SAME_SITE: "none",
    });
    try {
      let live = false;
      for (let i = 0; i < 80; i++) {
        try {
          const r = await fetch(`http://127.0.0.1:${port}/health/ready`);
          if (r.status === 200) {
            live = true;
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 100));
      }
      assert.equal(live, true, s.output());
      const csrf = await fetch(`http://127.0.0.1:${port}/api/v1/auth/csrf`);
      const cookie = csrf.headers.get("set-cookie")!;
      assert.match(cookie, /Secure/);
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=None/);
      s.child.kill("SIGTERM");
      const [code] = await s.done;
      assert.equal(code, 0, s.output());
      assert.match(s.output(), /shutdown/);
    } finally {
      if (s.child.exitCode === null) s.child.kill("SIGKILL");
    }
  },
);
test(
  "invalid environment and unavailable MySQL prevent startup",
  { timeout: 15000 },
  async () => {
    const bad = start({
      DB_PASSWORD: "sensitive-value-must-not-be-logged",
      DB_PORT: "not-a-port",
    });
    const [badCode] = await bad.done;
    assert.equal(badCode, 1);
    assert.equal(
      bad.output().includes("sensitive-value-must-not-be-logged"),
      false,
    );
    const down = start({ DB_PORT: String(await freePort()) });
    const [downCode] = await down.done;
    assert.equal(downCode, 1);
    assert.match(down.output(), /Database connection failed/);
  },
);
