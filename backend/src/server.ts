import { createApp } from "./app.js";
import { pool } from "./core/db.js";
import { configuration } from "./core/config.js";
import { log } from "./core/logger.js";
const cfg = configuration();
// Fail before listening when credentials/database are invalid.
try {
  await pool.query("SELECT 1");
} catch {
  log({
    level: "error",
    event: "startup",
    message: "Database connection failed",
  });
  await pool.end();
  process.exit(1);
}
const app = createApp();
const server = app.listen(cfg.port, cfg.host, () =>
  log({ level: "info", event: "listening", host: cfg.host, port: cfg.port }),
);
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
const cleanup = setInterval(() => {
  void Promise.all([
    pool.execute("DELETE FROM crm_sessions WHERE expires_at<UTC_TIMESTAMP(3)"),
    pool.execute(
      "DELETE FROM crm_auth_limits WHERE expires_at<UTC_TIMESTAMP(3)",
    ),
    pool.execute(
      "DELETE FROM crm_invitations WHERE expires_at<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 7 DAY)",
    ),
  ]).catch(() =>
    log({ level: "error", event: "cleanup", message: "Cleanup failed" }),
  );
}, 300_000);
cleanup.unref();
let closing = false;
function shutdown(exitCode: number) {
  if (closing) return;
  closing = true;
  clearInterval(cleanup);
  log({ level: "info", event: "shutdown" });
  server.close(() => {
    void pool
      .end()
      .then(() => process.exit(exitCode))
      .catch(() => process.exit(1));
  });
  server.closeIdleConnections();
  setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 10_000).unref();
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => shutdown(0));
server.on("error", () => {
  log({ level: "error", event: "listen_failed" });
  shutdown(1);
});
process.on("unhandledRejection", () => {
  log({ level: "error", event: "unhandled_rejection" });
  shutdown(1);
});
process.on("uncaughtException", () => {
  log({ level: "error", event: "uncaught_exception" });
  shutdown(1);
});
