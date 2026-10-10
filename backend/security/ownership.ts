import type { PoolConnection, Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import type { Response } from "express";

type Database = Pool | PoolConnection;
export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function respondToAccessError(error: unknown, res: Response): boolean {
  if (!(error instanceof AccessError)) return false;
  res.status(error.status).json({ success: false, error: error.message });
  return true;
}
export function recordId(value: unknown): number {
  if ((typeof value !== "number" && typeof value !== "string") ||
      (typeof value === "string" && !/^[1-9]\d*$/.test(value))) {
    throw new AccessError(400, "Invalid record ID");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AccessError(400, "Invalid record ID");
  return id;
}
export async function ownedUser(db: Database, value: unknown, companyId: number) {
  const id = recordId(value);
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE id = ? AND company_id = ?", [id, companyId]);
  if (!rows.length) throw new AccessError(404, "User not found");
}
export async function ownedGroup(db: Database, value: unknown, companyId: number) {
  const id = recordId(value);
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT g.id, g.users_id FROM `groups` g JOIN users u ON u.id = g.users_id WHERE g.id = ? AND u.company_id = ?",
    [id, companyId]);
  if (!rows.length) throw new AccessError(404, "Group not found");
  return rows[0];
}
export async function ownedGroups(db: Database, values: unknown, companyId: number) {
  if (values === undefined) return;
  if (!Array.isArray(values)) throw new AccessError(400, "group_ids must be an array");
  const ids = values.map(recordId);
  if (new Set(ids).size !== ids.length) throw new AccessError(400, "Duplicate group IDs");
  for (const id of ids) await ownedGroup(db, id, companyId);
}
