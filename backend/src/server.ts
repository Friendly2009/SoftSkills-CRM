import { createApp } from "./app.js";
import { pool } from "./core/db.js";
const app = createApp();
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const server = app.listen(port, host, () =>
  console.log(`SoftSkills CRM listening on ${host}:${port}`),
);
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
const cleanup = setInterval(() => {
  void pool
    .execute("DELETE FROM crm_sessions WHERE expires_at<UTC_TIMESTAMP(3)")
    .catch(() => console.error("Session cleanup failed"));
  void pool
    .execute("DELETE FROM crm_auth_limits WHERE expires_at<UTC_TIMESTAMP(3)")
    .catch(() => console.error("Auth throttle cleanup failed"));
}, 300_000);
cleanup.unref();
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    clearInterval(cleanup);
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
