import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool, rows } from "./core/db.js";
const db = await pool.getConnection();
try {
  const lock = (
    await rows(
      db,
      "SELECT GET_LOCK(CONCAT(DATABASE(),':crm-migrations'),30) AS acquired",
    )
  )[0];
  if (Number(lock?.acquired) !== 1)
    throw new Error("Migration lock unavailable");
  await db.query(
    "CREATE TABLE IF NOT EXISTS crm_migrations(name VARCHAR(200) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  for (const name of (await readdir("migrations"))
    .filter((n) => /^\d+.*\.sql$/.test(n))
    .sort()) {
    const sql = await readFile(`migrations/${name}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const prior = (
      await rows(db, "SELECT checksum FROM crm_migrations WHERE name=?", [name])
    )[0];
    if (prior) {
      if (prior.checksum !== checksum)
        throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    // MySQL DDL commits implicitly. Each statement is restart-safe; never reset existing data.
    for (const statement of sql
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean))
      await db.query(statement);
    await db.execute("INSERT INTO crm_migrations(name,checksum) VALUES(?,?)", [
      name,
      checksum,
    ]);
    console.log(`Applied ${name}`);
  }
} finally {
  await db.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(),':crm-migrations'))");
  db.release();
  await pool.end();
}
