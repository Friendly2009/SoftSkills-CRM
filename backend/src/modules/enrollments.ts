import type { Context } from "../core/api.js";
import { rows } from "../core/db.js";
import { scoped, get } from "../core/security.js";
import { assert } from "../core/errors.js";
import { isoTime } from "../core/validation.js";

// Half-open intervals [start,end). Ends sort before starts on a shared boundary.
export function peakOccupancy(
  periods: { starts_at: string; ends_at: string | null }[],
) {
  const events = periods.flatMap((p) => [
    [Date.parse(isoTime(p.starts_at)), 1],
    ...(p.ends_at ? [[Date.parse(isoTime(p.ends_at)), -1]] : []),
  ]);
  events.sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!);
  let current = 0,
    peak = 0;
  for (const [, delta] of events) peak = Math.max(peak, (current += delta!));
  return peak;
}
export async function validateEnrollment(
  c: Context,
  groupId: string,
  studentId: string,
  start: string,
  end: string | null,
  exclude?: string,
) {
  // The transaction's tenant mutex protects both this check and the subsequent write.
  const group = await scoped(c.db, c.actor, "groups", groupId);
  const student = await scoped(c.db, c.actor, "students", studentId);
  const person = await scoped(c.db, c.actor, "people", student.person_id);
  const br = await get(c.db, c.actor, "branches", group.branch_id);
  assert(
    br.active &&
      !br.archived_at &&
      student.active &&
      !student.archived_at &&
      person.active &&
      !person.archived_at &&
      !group.archived_at &&
      group.status !== "Архив" &&
      group.branch_id === student.branch_id,
    409,
    "ENROLLMENT_INVALID",
    "Student, person, branch and group must be active and in the same branch",
  );
  assert(!end || end > start, 400, "INVALID_PERIOD", "End must be after start");
  assert(
    (!group.start_date || start.slice(0, 10) >= group.start_date) &&
      (!group.end_date || (end && end.slice(0, 10) <= group.end_date)),
    409,
    "GROUP_PERIOD",
    "Membership must fit within the group period",
  );
  const periods = await rows(
    c.db,
    "SELECT * FROM crm_members WHERE org_id=? AND group_id=? AND archived_at IS NULL AND id<>?",
    [c.actor.org, groupId, exclude ?? ""],
  );
  assert(
    !periods.some(
      (p) =>
        p.student_id === studentId &&
        (!p.ends_at || isoTime(p.ends_at) > isoTime(start)) &&
        (!end || isoTime(p.starts_at) < isoTime(end)),
    ),
    409,
    "ENROLLMENT_OVERLAP",
    "Student already has an overlapping membership in this group",
  );
  assert(
    peakOccupancy([
      ...periods.map((p) => ({
        starts_at: String(p.starts_at),
        ends_at: p.ends_at as string | null,
      })),
      { starts_at: start, ends_at: end },
    ]) <= group.capacity,
    409,
    "GROUP_CAPACITY",
    "Group capacity would be exceeded during membership",
  );
  return group;
}
