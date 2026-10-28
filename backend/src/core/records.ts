import { z } from "zod";
import type { Context } from "./api.js";
import { rows } from "./db.js";
import { assert } from "./errors.js";
import { visible } from "../modules/resources.js";
import { permit } from "./security.js";

export const recordTables: Record<string, string> = {
  organization: "organizations",
  branches: "branches",
  rooms: "rooms",
  people: "people",
  payers: "payers",
  students: "students",
  staff: "staff",
  companies: "companies",
  tasks: "tasks",
  groups: "groups",
  leads: "leads",
  enrollments: "members",
  "payer-students": "payer_students",
};
export function recordResource(path: string) {
  const name = path === "/profile" ? "people" : path.split("/")[1]!;
  return recordTables[name] ? name : undefined;
}
export function needsVersion(method: string, path: string) {
  return (
    !!recordResource(path) &&
    (method === "patch" ||
      method === "delete" ||
      (method === "post" && (path.endsWith("/archive") || path.endsWith("/convert"))))
  );
}
export async function record(c: Context, resource: string, id: string) {
  if (resource === "people" && id === c.actor.personId) {
    const own = (
      await rows(c.db, "SELECT * FROM crm_people WHERE org_id=? AND id=?", [
        c.actor.org,
        id,
      ])
    )[0];
    assert(own, 404, "NOT_FOUND", "Person not found");
    return own;
  }
  if (resource !== "organization") return visible(c, resource, id);
  permit(c.actor, "director", "manager");
  const result = (
    await rows(c.db, "SELECT * FROM crm_organizations WHERE id=?", [
      c.actor.org,
    ])
  )[0];
  assert(
    result && id === c.actor.org,
    404,
    "NOT_FOUND",
    "Organization not found",
  );
  return result;
}
export async function snapshot(c: Context, resource: string, id: string) {
  const value = { ...(await record(c, resource, id)) };
  if (resource === "people")
    value.contacts = await rows(
      c.db,
      "SELECT kind,value FROM crm_contacts WHERE org_id=? AND person_id=? ORDER BY kind,value",
      [c.actor.org, id],
    );
  if (["groups", "students"].includes(resource))
    value.memberships = await rows(
      c.db,
      `SELECT * FROM crm_members WHERE org_id=? AND ${resource === "groups" ? "group_id" : "student_id"}=? ORDER BY id`,
      [c.actor.org, id],
    );
  return value;
}
export async function beforeWrite(c: Context, method: string, path: string) {
  const resource = recordResource(path);
  if (!resource || method === "get" || path.endsWith("/comments"))
    return undefined;
  if (path !== "/profile")
    permit(
      c.actor,
      ...(["organization", "branches", "rooms", "staff"].includes(resource)
        ? ["director"]
        : path === "/tasks/:id/status"
          ? ["director", "manager", "teacher"]
          : ["director", "manager"]),
    );
  if (c.req.body?.branchId) {
    const branch = (
      await rows(
        c.db,
        "SELECT active,archived_at FROM crm_branches WHERE org_id=? AND id=?",
        [c.actor.org, c.req.body.branchId],
      )
    )[0];
    assert(branch, 404, "NOT_FOUND", "Branch not found");
    assert(
      branch.active && !branch.archived_at,
      409,
      "BRANCH_INACTIVE",
      "Branch is inactive",
    );
  }
  const id =
    resource === "organization"
      ? c.actor.org
      : path === "/profile"
        ? c.actor.personId
        : c.req.params.id;
  if (!id) return { resource, before: null };
  const before = await snapshot(c, resource, String(id));
  if (needsVersion(method, path)) {
    const raw = c.req.get("If-Match");
    assert(
      raw,
      400,
      "VERSION_REQUIRED",
      'Send If-Match: "<version>" from the current card',
    );
    const expected = Number(
      z
        .string()
        .regex(/^"[1-9]\d{0,9}"$/)
        .parse(raw)
        .slice(1, -1),
    );
    assert(
      before.version === expected,
      409,
      "VERSION_CONFLICT",
      "Record changed. Reload the card before saving.",
    );
  }
  assert(
    !before.archived_at,
    409,
    "ARCHIVED",
    "Archived record cannot be changed",
  );
  return { resource, before };
}
export async function afterWrite(
  c: Context,
  path: string,
  state: Awaited<ReturnType<typeof beforeWrite>>,
  output: any,
) {
  if (!state) return output;
  const { resource, before } = state;
  const id =
    resource === "organization"
      ? c.actor.org
      : path === "/profile"
        ? c.actor.personId
        : (c.req.params.id ?? output?.id);
  if (!id) return output;
  const changed = await record(c, resource, String(id));
  if (changed.status === "Архив" && !changed.archived_at) {
    await c.db.execute(
      `UPDATE crm_${recordTables[resource]} SET archived_at=UTC_TIMESTAMP(3) WHERE org_id=? AND id=?`,
      [c.actor.org, id],
    );
    changed.archived_at = true;
  }
  if (changed.archived_at) {
    if (["people", "students", "branches"].includes(resource))
      await c.db.execute(
        `UPDATE crm_${recordTables[resource]} SET active=FALSE WHERE org_id=? AND id=?`,
        [c.actor.org, id],
      );
    if (["groups", "staff", "companies"].includes(resource))
      await c.db.execute(
        `UPDATE crm_${recordTables[resource]} SET status='Архив' WHERE org_id=? AND id=?`,
        [c.actor.org, id],
      );
    if (["groups", "students", "enrollments"].includes(resource)) {
      const column =
        resource === "groups"
          ? "group_id"
          : resource === "students"
            ? "student_id"
            : "id";
      await c.db.execute(
        `UPDATE crm_members SET ends_at=CASE WHEN starts_at<UTC_TIMESTAMP(3) THEN UTC_TIMESTAMP(3) ELSE ends_at END, archived_at=CASE WHEN starts_at>=UTC_TIMESTAMP(3) THEN UTC_TIMESTAMP(3) ELSE archived_at END, version=version+${resource === "enrollments" ? 0 : 1} WHERE org_id=? AND ${column}=? AND (ends_at IS NULL OR ends_at>UTC_TIMESTAMP(3))`,
        [c.actor.org, id],
      );
    }
  }
  if (before) {
    const where = resource === "organization" ? "id=?" : "org_id=? AND id=?";
    const args =
      resource === "organization"
        ? [id, before.version]
        : [c.actor.org, id, before.version];
    const [result]: any = await c.db.execute(
      `UPDATE crm_${recordTables[resource]} SET version=version+1 WHERE ${where} AND version=?`,
      args,
    );
    assert(
      result.affectedRows === 1,
      409,
      "VERSION_CONFLICT",
      "Record changed. Reload the card.",
    );
  }
  const after = await snapshot(c, resource, String(id));
  if (["groups", "students"].includes(resource)) {
    for (const member of after.memberships ?? []) {
      const prior = before?.memberships?.find((m: any) => m.id === member.id);
      if (JSON.stringify(prior) !== JSON.stringify(member))
        await c.db.execute(
          "INSERT INTO crm_record_history(id,org_id,resource,resource_id,author_id,action,before_data,after_data) VALUES(UUID(),?,?,?,?,?,?,?)",
          [
            c.actor.org,
            "enrollments",
            member.id,
            c.actor.id,
            c.req.method + " " + path,
            prior ? JSON.stringify(prior) : null,
            JSON.stringify(member),
          ],
        );
    }
  }
  await c.db.execute(
    "INSERT INTO crm_record_history(id,org_id,resource,resource_id,author_id,action,before_data,after_data) VALUES(UUID(),?,?,?,?,?,?,?)",
    [
      c.actor.org,
      resource,
      id,
      c.actor.id,
      c.req.method + " " + path,
      before ? JSON.stringify(before) : null,
      JSON.stringify(after),
    ],
  );
  if (path === "/groups/:id/members" && c.req.method === "POST") {
    const membership = after.memberships.find((m: any) => m.id === output.id);
    return {
      ...output,
      version: membership.version,
      groupVersion: after.version,
    };
  }
  return { ...output, version: after.version };
}

// For secondary records created/updated inside a larger transaction (conversion/import/profile).
export async function secondaryHistory(
  c: Context,
  resource: string,
  id: string,
  before: any = null,
) {
  const after = await snapshot(c, resource, id);
  await c.db.execute(
    "INSERT INTO crm_record_history(id,org_id,resource,resource_id,author_id,action,before_data,after_data) VALUES(UUID(),?,?,?,?,?,?,?)",
    [
      c.actor.org,
      resource,
      id,
      c.actor.id,
      "related:" + c.req.method + " " + c.req.route.path.replace("/api/v1", ""),
      before ? JSON.stringify(before) : null,
      JSON.stringify(after),
    ],
  );
}
