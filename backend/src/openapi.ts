import { writeFile } from "node:fs/promises";
// Offline schema generation needs no real secret, database connection or .env.
process.env.SESSION_SECRET = "offline-schema-generation-only-00000000";
process.env.NODE_ENV = "development";
process.env.DB_HOST = "127.0.0.1";
process.env.DB_USER = "schema";
process.env.DB_PASSWORD = "offline";
process.env.DB_NAME = "schema";
const { createApp } = await import("./app.js");
const { openapi } = await import("./core/api.js");
createApp();
await writeFile(
  "../docs/openapi.json",
  JSON.stringify(openapi(), null, 2) + "\n",
);
console.log("Wrote docs/openapi.json");
