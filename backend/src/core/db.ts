import "dotenv/config";
import mysql, { type PoolConnection, type RowDataPacket } from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  timezone: "Z",
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  multipleStatements: false,
});
export type DB = PoolConnection;
export type Row = Record<string, any>;
export async function rows(
  db: DB,
  sql: string,
  args: any[] = [],
): Promise<Row[]> {
  const [result] = await db.execute<RowDataPacket[]>(sql, args);
  return result;
}
export async function transaction<T>(
  org: string | null,
  fn: (db: DB) => Promise<T>,
): Promise<T> {
  const db = await pool.getConnection();
  try {
    await db.query("SET time_zone = '+00:00'");
    await db.beginTransaction();
    // All tenant writes AND authorization rechecks use this mutex. Deliberately conservative for beta.
    if (org)
      await rows(db, "SELECT id FROM crm_organizations WHERE id=? FOR UPDATE", [
        org,
      ]);
    const value = await fn(db);
    await db.commit();
    return value;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
