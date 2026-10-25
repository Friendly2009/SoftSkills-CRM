import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
import { assert } from "./errors.js";
import { rows, type DB, type Row } from "./db.js";
import { json } from "./validation.js";
const scrypt = promisify(scryptCallback);
export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(value, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(value: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const key = (await scrypt(value, salt!, 64)) as Buffer;
  const expected = Buffer.from(hex!, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function token() {
  return randomBytes(32).toString("hex");
}
export function digest(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export type Actor = {
  id: string;
  org: string;
  personId: string;
  roles: string[];
  branches: string[];
};
export function actor(row: Row): Actor {
  return {
    id: row.id,
    org: row.org_id,
    personId: row.person_id,
    roles: json(row.roles),
    branches: json(row.branches),
  };
}
export function has(a: Actor, ...r: string[]) {
  return r.some((v) => a.roles.includes(v));
}
export function permit(a: Actor, ...roles: string[]) {
  assert(has(a, ...roles), 403, "FORBIDDEN", "Insufficient permissions");
}
export function branch(a: Actor, id: string) {
  assert(
    has(a, "director") || a.branches.length === 0 || a.branches.includes(id),
    403,
    "BRANCH_FORBIDDEN",
    "Branch access denied",
  );
}
export async function get(
  db: DB,
  a: Actor,
  table: string,
  id: string,
): Promise<Row> {
  const result = (
    await rows(db, `SELECT * FROM crm_${table} WHERE org_id=? AND id=?`, [
      a.org,
      id,
    ])
  )[0];
  assert(result, 404, "NOT_FOUND", "Resource not found");
  return result;
}
export async function scoped(db: DB, a: Actor, table: string, id: string) {
  const value = await get(db, a, table, id);
  if (value.branch_id) branch(a, value.branch_id);
  return value;
}
export async function audit(
  db: DB,
  a: Actor,
  action: string,
  resource: string,
  id: string,
  requestId: string,
  details: unknown = {},
) {
  await db.execute(
    "INSERT INTO crm_audit(id,org_id,actor_id,action,resource,resource_id,request_id,details) VALUES(UUID(),?,?,?,?,?,?,?)",
    [a.org, a.id, action, resource, id, requestId, JSON.stringify(details)],
  );
}
