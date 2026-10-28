import { validateEnrollment, peakOccupancy } from "./enrollments.js";
import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route, type Context } from "../core/api.js";
import { rows } from "../core/db.js";
import { permit, scoped, get, branch, has } from "../core/security.js";
import { assert } from "../core/errors.js";
import {
  id,
  text,
  date,
  note,
  instant,
  money,
  amount,
  sqlTime,
  isoTime,
} from "../core/validation.js";
import { notifyStaff } from "./collaboration.js";
import { lessonDiscount, timeZone } from "./educationRules.js";
import { entry } from "./finance.js";
const groupSchema = z
  .object({
    branchId: id,
    teacherId: id,
    name: text,
    subject: text,
    capacity: z.number().int().min(1).max(10000),
    status: z.enum(["Идёт набор", "Активна", "Архив"]).default("Идёт набор"),
    startDate: date.nullable().default(null),
    endDate: date.nullable().default(null),
  })
  .strict()
  .refine(
    (b) => !b.startDate || !b.endDate || b.endDate >= b.startDate,
    "End before start",
  );
export const attendee = z
  .object({
    studentId: id,
    payerId: id.optional(),
    price: money.optional(),
    discount: money.optional(),
    discountPercent: z.number().int().min(0).max(10000).optional(),
    subscriptionId: id.nullable().default(null),
  })
  .strict()
  .refine(
    (v) => v.discount === undefined || v.discountPercent === undefined,
    "Use fixed discount OR percentage in basis points",
  );
export const lessonSchema = z
  .object({
    branchId: id,
    name: text,
    groupId: id.nullable().default(null),
    teacherId: id,
    roomId: id,
    startsAt: instant,
    endsAt: instant,
    salary: money.optional(),
    basePrice: money.default("0"),
    timezone: timeZone.default("UTC"),
    subject: text.nullable().default(null),
    attendees: z.array(attendee).min(1).max(500),
    comment: note,
  })
  .strict()
  .refine(
    (v) =>
      new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime() &&
      new Date(v.endsAt).getTime() - new Date(v.startsAt).getTime() <= 86400000,
    "Lesson duration must be >0 and <=24h",
  )
  .refine(
    (v) =>
      new Set(v.attendees.map((a) => a.studentId)).size === v.attendees.length,
    "Duplicate students",
  );
export async function checkSchedule(c: Context, b: any, exclude: string) {
  const collisions = await rows(
    c.db,
    "SELECT id FROM crm_lessons WHERE org_id=? AND id<>? AND status<>'cancelled' AND starts_at<? AND ends_at>? AND (teacher_id=? OR room_id=?) LIMIT 1",
    [
      c.actor.org,
      exclude,
      sqlTime(b.endsAt),
      sqlTime(b.startsAt),
      b.teacherId,
      b.roomId,
    ],
  );
  assert(
    !collisions.length,
    409,
    "SCHEDULE_CONFLICT",
    "Room or teacher already occupied",
  );
}
async function validateLesson(c: Context, b: any, exclude: string) {
  branch(c.actor, b.branchId);
  const br = await get(c.db, c.actor, "branches", b.branchId);
  assert(
    br.active && !br.archived_at,
    409,
    "BRANCH_INACTIVE",
    "Branch is inactive",
  );
  const teacher = await scoped(c.db, c.actor, "staff", b.teacherId);
  assert(
    teacher.status === "Работает" &&
      !teacher.archived_at &&
      teacher.branch_id === b.branchId,
    409,
    "STAFF_INACTIVE",
    "Teacher is not working",
  );
  const room = await scoped(c.db, c.actor, "rooms", b.roomId);
  assert(
    room.branch_id === b.branchId && !room.archived_at,
    400,
    "BRANCH_MISMATCH",
    "Room belongs to a different branch",
  );
  assert(
    room.capacity === null || b.attendees.length <= room.capacity,
    409,
    "ROOM_CAPACITY",
    "Room capacity exceeded",
  );
  if (b.groupId) {
    const g = await scoped(c.db, c.actor, "groups", b.groupId);
    assert(
      g.branch_id === b.branchId && g.status !== "Архив" && !g.archived_at,
      409,
      "GROUP_INVALID",
      "Inactive group or branch mismatch",
    );
    assert(
      b.attendees.length <= g.capacity,
      409,
      "GROUP_CAPACITY",
      "Group capacity exceeded",
    );
    assert(
      !b.subject || b.subject === g.subject,
      400,
      "SUBJECT_MISMATCH",
      "Group subject must match",
    );
    b.subject = g.subject;
    for (const a of b.attendees)
      assert(
        (
          await rows(
            c.db,
            "SELECT id FROM crm_members WHERE org_id=? AND group_id=? AND student_id=? AND archived_at IS NULL AND starts_at<=? AND (ends_at IS NULL OR ends_at>=?)",
            [
              c.actor.org,
              b.groupId,
              a.studentId,
              sqlTime(b.startsAt),
              sqlTime(b.endsAt),
            ],
          )
        ).length,
        400,
        "NOT_GROUP_MEMBER",
        "Student is not in group",
      );
  } else
    assert(
      b.attendees.length === 1,
      400,
      "INDIVIDUAL_SIZE",
      "Individual lesson needs exactly one student",
    );
  for (const a of b.attendees) {
    const s = await scoped(c.db, c.actor, "students", a.studentId);
    assert(
      s.active && !s.archived_at && s.branch_id === b.branchId,
      409,
      "STUDENT_INVALID",
      "Inactive student or branch mismatch",
    );
    lessonDiscount(a.price ?? b.basePrice, a.discount, a.discountPercent);
    const payerId = a.payerId ?? s.payer_id;
    const payer = await scoped(c.db, c.actor, "payers", payerId);
    assert(
      !payer.archived_at && payer.branch_id === b.branchId,
      409,
      "PAYER_INVALID",
      "Payer must be active in the lesson branch",
    );
    assert(
      (
        await rows(
          c.db,
          "SELECT id FROM crm_payer_students WHERE org_id=? AND payer_id=? AND student_id=? AND archived_at IS NULL",
          [c.actor.org, payerId, s.id],
        )
      ).length,
      409,
      "PAYER_NOT_LINKED",
      "Payer must be linked to student",
    );
    if (a.subscriptionId) {
      const sub = await scoped(
        c.db,
        c.actor,
        "subscriptions",
        a.subscriptionId,
      );
      assert(
        sub.student_id === s.id && sub.branch_id === b.branchId,
        400,
        "SUBSCRIPTION_OWNER",
        "Subscription belongs to another student",
      );
      assertSubscriptionScope(sub, { group_id: b.groupId, subject: b.subject });
    }
  }
  if (b.salary !== undefined) permit(c.actor, "director");
  await checkSchedule(c, b, exclude);
  return teacher;
}
export function educationRoutes(app: Express) {
  for (const method of ["post", "patch"] as const)
    route(
      app,
      method,
      "/groups" + (method === "patch" ? "/:id" : ""),
      { body: groupSchema, summary: "Create/update group with capacity guard" },
      async (c, b) => {
        permit(c.actor, "director", "manager");
        branch(c.actor, b.branchId);
        const br = await get(c.db, c.actor, "branches", b.branchId);
        const teacher = await scoped(c.db, c.actor, "staff", b.teacherId);
        assert(
          br.active &&
            !br.archived_at &&
            !teacher.archived_at &&
            teacher.status === "Работает" &&
            teacher.branch_id === b.branchId,
          409,
          "TEACHER_INVALID",
          "Active teacher and branch must match",
        );
        const groupId =
          method === "post" ? randomUUID() : String(c.req.params.id);
        if (method === "patch") {
          const old = await scoped(c.db, c.actor, "groups", groupId);
          assert(
            old.branch_id === b.branchId,
            409,
            "BRANCH_IMMUTABLE",
            "Group branch cannot change",
          );
          const periods = await rows(
            c.db,
            "SELECT starts_at,ends_at FROM crm_members WHERE org_id=? AND group_id=? AND archived_at IS NULL",
            [c.actor.org, groupId],
          );
          assert(
            peakOccupancy(periods as any) <= b.capacity,
            409,
            "GROUP_CAPACITY",
            "Capacity lower than reserved membership",
          );
          assert(
            periods.every(
              (p) =>
                (!b.startDate || p.starts_at.slice(0, 10) >= b.startDate) &&
                (!b.endDate ||
                  (p.ends_at && p.ends_at.slice(0, 10) <= b.endDate)),
            ),
            409,
            "GROUP_PERIOD",
            "Group dates exclude existing memberships",
          );
          const planned = await rows(
            c.db,
            "SELECT l.id FROM crm_lessons l JOIN crm_attendees a ON a.org_id=l.org_id AND a.lesson_id=l.id WHERE l.org_id=? AND l.group_id=? AND l.status='scheduled' GROUP BY l.id HAVING COUNT(*)>? LIMIT 1",
            [c.actor.org, groupId, b.capacity],
          );
          assert(
            !planned.length,
            409,
            "GROUP_CAPACITY",
            "Capacity lower than a scheduled lesson roster",
          );
          await c.db.execute(
            "UPDATE crm_groups SET teacher_id=?,name=?,subject=?,capacity=?,status=?,start_date=?,end_date=? WHERE org_id=? AND id=?",
            [
              b.teacherId,
              b.name,
              b.subject,
              b.capacity,
              b.status,
              b.startDate,
              b.endDate,
              c.actor.org,
              groupId,
            ],
          );
        } else
          await c.db.execute(
            "INSERT INTO crm_groups(id,org_id,branch_id,teacher_id,name,subject,capacity,status,start_date,end_date) VALUES(?,?,?,?,?,?,?,?,?,?)",
            [
              groupId,
              c.actor.org,
              b.branchId,
              b.teacherId,
              b.name,
              b.subject,
              b.capacity,
              b.status,
              b.startDate,
              b.endDate,
            ],
          );
        return { id: groupId };
      },
    );
  route(
    app,
    "post",
    "/groups/:id/members",
    {
      body: z
        .object({
          studentId: id,
          startsAt: instant.optional(),
          endsAt: instant.nullable().default(null),
        })
        .strict(),
      summary: "Enroll student with concurrent capacity protection",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const starts = sqlTime(b.startsAt ?? new Date().toISOString());
      const ends = b.endsAt ? sqlTime(b.endsAt) : null;
      const g = await validateEnrollment(
        c,
        String(c.req.params.id),
        b.studentId,
        starts,
        ends,
      );
      const membership = randomUUID();
      await c.db.execute(
        "INSERT INTO crm_members(id,org_id,group_id,student_id,branch_id,starts_at,ends_at) VALUES(?,?,?,?,?,?,?)",
        [membership, c.actor.org, g.id, b.studentId, g.branch_id, starts, ends],
      );
      return { id: membership };
    },
  );
  route(
    app,
    "delete",
    "/groups/:id/members/:studentId",
    {
      summary:
        "End current/future membership, preserving periods and lesson roster",
    },
    async (c) => {
      permit(c.actor, "director", "manager");
      await scoped(c.db, c.actor, "groups", String(c.req.params.id));
      await c.db.execute(
        "UPDATE crm_members SET ends_at=CASE WHEN starts_at<UTC_TIMESTAMP(3) THEN UTC_TIMESTAMP(3) ELSE ends_at END, archived_at=CASE WHEN starts_at>=UTC_TIMESTAMP(3) THEN UTC_TIMESTAMP(3) ELSE archived_at END,version=version+1 WHERE org_id=? AND group_id=? AND student_id=? AND archived_at IS NULL AND (ends_at IS NULL OR ends_at>UTC_TIMESTAMP(3))",
        [c.actor.org, c.req.params.id, c.req.params.studentId],
      );
      return { removed: true };
    },
  );
  route(
    app,
    "post",
    "/lessons",
    {
      body: lessonSchema,
      summary: "Schedule one group or individual lesson with price snapshots",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const lessonId = randomUUID();
      const teacher = await validateLesson(c, b, lessonId);
      await c.db.execute(
        "INSERT INTO crm_lessons(id,org_id,branch_id,name,group_id,teacher_id,room_id,starts_at,ends_at,salary,comment,base_price,timezone,subject) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          lessonId,
          c.actor.org,
          b.branchId,
          b.name,
          b.groupId,
          b.teacherId,
          b.roomId,
          sqlTime(b.startsAt),
          sqlTime(b.endsAt),
          b.salary ?? teacher.rate,
          b.comment,
          b.basePrice,
          b.timezone,
          b.subject,
        ],
      );
      await saveAttendees(c, lessonId, b.attendees, b.basePrice);
      await notifyStaff(c, b.teacherId, `Назначено занятие: ${b.name}`);
      return { id: lessonId, revision: 0 };
    },
  );
  route(
    app,
    "patch",
    "/lessons/:id",
    {
      body: lessonSchema.safeExtend({
        expectedRevision: z.number().int().min(0),
      }),
      summary: "Reschedule or substitute teacher on an uncompleted lesson",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const old = await scoped(
        c.db,
        c.actor,
        "lessons",
        String(c.req.params.id),
      );
      assert(
        old.status === "scheduled",
        409,
        "LESSON_STATE",
        "Only scheduled lesson can be edited",
      );
      assert(
        old.revision === b.expectedRevision,
        409,
        "STALE_REVISION",
        "Reload lesson",
      );
      assert(
        old.branch_id === b.branchId,
        409,
        "BRANCH_IMMUTABLE",
        "Lesson branch cannot change",
      );
      const t = await validateLesson(c, b, old.id);
      const salary =
        b.salary ?? (old.teacher_id === b.teacherId ? old.salary : t.rate);
      await c.db.execute(
        "UPDATE crm_lessons SET name=?,group_id=?,teacher_id=?,room_id=?,starts_at=?,ends_at=?,salary=?,comment=?,base_price=?,timezone=?,subject=?,revision=revision+1 WHERE org_id=? AND id=?",
        [
          b.name,
          b.groupId,
          b.teacherId,
          b.roomId,
          sqlTime(b.startsAt),
          sqlTime(b.endsAt),
          salary,
          b.comment,
          b.basePrice,
          b.timezone,
          b.subject,
          c.actor.org,
          old.id,
        ],
      );
      await c.db.execute(
        "DELETE FROM crm_attendees WHERE org_id=? AND lesson_id=?",
        [c.actor.org, old.id],
      );
      await saveAttendees(c, old.id, b.attendees, b.basePrice);
      return { id: old.id, revision: old.revision + 1 };
    },
  );
  route(
    app,
    "post",
    "/lessons/:id/complete",
    {
      idem: true,
      body: z
        .object({
          expectedRevision: z.number().int().min(0),
          reason: z.string().trim().min(1).max(1000),
          teacherId: id.optional(),
          salary: money.optional(),
          attendance: z
            .array(
              z
                .object({
                  studentId: id,
                  status: z.enum(["present", "absent", "excused"]),
                  payerId: id.optional(),
                  price: money.optional(),
                  discount: money.optional(),
                  discountPercent: z
                    .number()
                    .int()
                    .min(0)
                    .max(10000)
                    .optional(),
                  subscriptionId: id.nullable().optional(),
                })
                .strict(),
            )
            .min(1)
            .max(500),
        })
        .strict(),
      summary: "Conduct lesson or correct attendance/charges using reversals",
    },
    conductLesson,
  );
  route(
    app,
    "post",
    "/lessons/:id/cancel",
    {
      idem: true,
      body: z
        .object({
          expectedRevision: z.number().int().min(0),
          reason: z.string().trim().min(1).max(1000),
        })
        .strict(),
      summary: "Cancel a lesson, reversing charges and salary if conducted",
    },
    async (c, b) => {
      permit(c.actor, "director", "manager");
      const l = await scoped(c.db, c.actor, "lessons", String(c.req.params.id));
      assert(
        l.revision === b.expectedRevision,
        409,
        "STALE_REVISION",
        "Reload lesson",
      );
      assert(
        l.status !== "cancelled",
        409,
        "ALREADY_CANCELLED",
        "Already cancelled",
      );
      const operation = randomUUID();
      if (l.status === "completed")
        await reverseLesson(c, l, operation, b.reason, l.revision + 1);
      await c.db.execute(
        "UPDATE crm_lessons SET status='cancelled',revision=revision+1 WHERE org_id=? AND id=?",
        [c.actor.org, l.id],
      );
      return { id: l.id, revision: l.revision + 1, operationId: operation };
    },
  );
}
async function saveAttendees(
  c: Context,
  lesson: string,
  list: any[],
  basePrice: string,
) {
  for (const a of list) {
    const s = await get(c.db, c.actor, "students", a.studentId);
    await c.db.execute(
      "INSERT INTO crm_attendees(id,org_id,lesson_id,student_id,payer_id,subscription_id,price,discount,discount_percent) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        randomUUID(),
        c.actor.org,
        lesson,
        s.id,
        a.payerId ?? s.payer_id,
        a.subscriptionId,
        a.price ?? basePrice,
        lessonDiscount(a.price ?? basePrice, a.discount, a.discountPercent),
        a.discountPercent ?? null,
      ],
    );
  }
}
async function reverseLesson(
  c: Context,
  l: any,
  operation: string,
  reason: string,
  newRevision: number,
) {
  const entries = await rows(
    c.db,
    "SELECT e.* FROM crm_ledger e WHERE e.org_id=? AND e.lesson_id=? AND e.reversal_of IS NULL AND NOT EXISTS(SELECT 1 FROM crm_ledger r WHERE r.org_id=e.org_id AND r.reversal_of=e.id)",
    [c.actor.org, l.id],
  );
  for (const e of entries)
    await entry(
      c,
      e.account_id,
      (-BigInt(e.amount)).toString(),
      "lesson_reversal",
      operation,
      reason,
      l.id,
      newRevision,
      e.id,
    );
  const uses = await rows(
    c.db,
    "SELECT subscription_id,SUM(delta) AS n FROM crm_subscription_usage WHERE org_id=? AND lesson_id=? GROUP BY subscription_id HAVING n>0",
    [c.actor.org, l.id],
  );
  for (const u of uses) {
    assert(
      Number(u.n) === 1,
      500,
      "USAGE_INVARIANT",
      "Invalid subscription usage",
    );
    await c.db.execute(
      "INSERT INTO crm_subscription_usage(id,org_id,subscription_id,lesson_id,revision,delta) VALUES(?,?,?,?,?,-1)",
      [randomUUID(), c.actor.org, u.subscription_id, l.id, newRevision],
    );
  }
}
async function consume(
  c: Context,
  subscription: string,
  lesson: any,
  revision: number,
  previouslyCharged: boolean,
) {
  const sub = await get(c.db, c.actor, "subscriptions", subscription);
  if (!previouslyCharged) {
    assert(
      !sub.frozen_at,
      409,
      "SUBSCRIPTION_FROZEN",
      "Subscription is currently frozen",
    );
    assert(
      Date.now() >= Date.parse(isoTime(sub.starts_at)) &&
        Date.now() < Date.parse(isoTime(sub.ends_at)),
      409,
      "SUBSCRIPTION_EXPIRED",
      "Unused lessons cannot be consumed outside subscription validity",
    );
  }
  assert(
    lesson.starts_at >= sub.starts_at && lesson.starts_at < sub.ends_at,
    409,
    "SUBSCRIPTION_EXPIRED",
    "Subscription not valid at lesson time",
  );
  const freezes = await rows(
    c.db,
    "SELECT id FROM crm_freezes WHERE org_id=? AND subscription_id=? AND starts_at<=? AND (ends_at IS NULL OR ends_at>?)",
    [c.actor.org, sub.id, lesson.starts_at, lesson.starts_at],
  );
  assert(
    !freezes.length,
    409,
    "SUBSCRIPTION_FROZEN",
    "Subscription frozen at lesson time",
  );
  const used = (
    await rows(
      c.db,
      "SELECT COALESCE(SUM(delta),0) AS n FROM crm_subscription_usage WHERE org_id=? AND subscription_id=?",
      [c.actor.org, sub.id],
    )
  )[0]?.n;
  assert(
    Number(used) < sub.allowance,
    409,
    "SUBSCRIPTION_EMPTY",
    "No subscription lessons left",
  );
  await c.db.execute(
    "INSERT INTO crm_subscription_usage(id,org_id,subscription_id,lesson_id,revision,delta) VALUES(?,?,?,?,?,1)",
    [randomUUID(), c.actor.org, sub.id, lesson.id, revision],
  );
}

/** Called inside route transaction, holding the organization mutex. Ledger, usage and status commit together. */
export async function conductLesson(c: Context, b: any) {
  permit(c.actor, "director", "manager", "teacher");
  const lesson = await scoped(
    c.db,
    c.actor,
    "lessons",
    String(c.req.params.id),
  );
  assert(
    lesson.status !== "cancelled",
    409,
    "LESSON_CANCELLED",
    "Cancelled lesson",
  );
  assert(
    lesson.revision === b.expectedRevision,
    409,
    "STALE_REVISION",
    "Reload lesson",
  );
  if (!has(c.actor, "director", "manager")) {
    assert(
      b.teacherId === undefined && b.salary === undefined,
      403,
      "FORBIDDEN",
      "Teacher cannot change teacher or salary",
    );
    const t = await get(c.db, c.actor, "staff", lesson.teacher_id);
    assert(
      t.person_id === c.actor.personId,
      403,
      "FORBIDDEN",
      "Not your lesson",
    );
    assert(
      lesson.status === "scheduled",
      403,
      "CORRECTION_FORBIDDEN",
      "Teacher cannot correct a completed lesson",
    );
    assert(
      b.attendance.every(
        (v: any) =>
          v.payerId === undefined &&
          v.price === undefined &&
          v.discount === undefined &&
          v.discountPercent === undefined &&
          v.subscriptionId === undefined,
      ),
      403,
      "PRICE_FORBIDDEN",
      "Teacher cannot set prices",
    );
  }
  assert(
    Date.parse(isoTime(lesson.starts_at)) <= Date.now(),
    409,
    "FUTURE_LESSON",
    "Cannot conduct a future lesson",
  );
  const roster = await rows(
    c.db,
    "SELECT * FROM crm_attendees WHERE org_id=? AND lesson_id=?",
    [c.actor.org, lesson.id],
  );
  assert(
    b.attendance.length === roster.length &&
      new Set(b.attendance.map((v: any) => v.studentId)).size ===
        roster.length &&
      b.attendance.every((v: any) =>
        roster.some((a) => a.student_id === v.studentId),
      ),
    400,
    "ROSTER_MISMATCH",
    "Attendance must cover the exact lesson roster",
  );
  let salary = lesson.salary;
  const teacherId = b.teacherId ?? lesson.teacher_id;
  if (teacherId !== lesson.teacher_id) {
    const t = await scoped(c.db, c.actor, "staff", teacherId);
    assert(
      t.branch_id === lesson.branch_id &&
        t.status === "Работает" &&
        !t.archived_at,
      409,
      "TEACHER_INVALID",
      "Active teacher must belong to lesson branch",
    );
    await checkSchedule(
      c,
      {
        teacherId,
        roomId: lesson.room_id,
        startsAt: isoTime(lesson.starts_at),
        endsAt: isoTime(lesson.ends_at),
      },
      lesson.id,
    );
    salary = t.rate;
  }
  if (b.salary !== undefined) {
    permit(c.actor, "director");
    salary = b.salary;
  }
  const operation = randomUUID();
  const revision = lesson.revision + 1;
  if (lesson.status === "completed")
    await reverseLesson(c, lesson, operation, b.reason, revision);
  for (const a of roster) {
    const v = b.attendance.find((v: any) => v.studentId === a.student_id);
    const payerId = v.payerId ?? a.payer_id;
    if (v.payerId !== undefined) {
      const p = await scoped(c.db, c.actor, "payers", payerId);
      assert(
        p.branch_id === lesson.branch_id && !p.archived_at,
        409,
        "PAYER_INVALID",
        "Active payer must belong to lesson branch",
      );
      assert(
        (
          await rows(
            c.db,
            "SELECT id FROM crm_payer_students WHERE org_id=? AND payer_id=? AND student_id=? AND archived_at IS NULL",
            [c.actor.org, payerId, a.student_id],
          )
        ).length,
        409,
        "PAYER_NOT_LINKED",
        "Payer must be linked to student",
      );
    }
    const price = v.price ?? a.price;
    const percent =
      v.discountPercent ??
      (v.discount === undefined ? a.discount_percent : null);
    const fixed = v.discount ?? (percent === null ? a.discount : undefined);
    assert(
      v.discount === undefined || v.discountPercent === undefined,
      400,
      "INVALID_DISCOUNT",
      "Choose one discount type",
    );
    const discount = lessonDiscount(price, fixed, percent ?? undefined);
    const subscriptionId =
      v.subscriptionId === undefined ? a.subscription_id : v.subscriptionId;
    if (subscriptionId) {
      const sub = await scoped(c.db, c.actor, "subscriptions", subscriptionId);
      assert(
        sub.student_id === a.student_id && sub.branch_id === lesson.branch_id,
        409,
        "SUBSCRIPTION_OWNER",
        "Subscription owner/branch mismatch",
      );
      assertSubscriptionScope(sub, lesson);
    }
    await c.db.execute(
      "UPDATE crm_attendees SET attendance=?,price=?,discount=?,discount_percent=?,subscription_id=?,payer_id=? WHERE org_id=? AND id=?",
      [
        v.status,
        price,
        discount,
        percent,
        subscriptionId,
        payerId,
        c.actor.org,
        a.id,
      ],
    );
    if (v.status === "excused") continue;
    if (subscriptionId)
      await consume(
        c,
        subscriptionId,
        lesson,
        revision,
        lesson.status === "completed" &&
          subscriptionId === a.subscription_id &&
          ["present", "absent"].includes(a.attendance),
      );
    await entry(
      c,
      payerId,
      (-BigInt(amount(price, discount))).toString(),
      "lesson_charge",
      operation,
      b.reason,
      lesson.id,
      revision,
    );
  }
  await entry(
    c,
    teacherId,
    String(salary),
    "salary_accrual",
    operation,
    b.reason,
    lesson.id,
    revision,
  );
  await c.db.execute(
    "UPDATE crm_lessons SET status='completed',revision=?,teacher_id=?,salary=? WHERE org_id=? AND id=?",
    [revision, teacherId, salary, c.actor.org, lesson.id],
  );
  return { id: lesson.id, revision, operationId: operation };
}

export function assertSubscriptionScope(sub: any, lesson: any) {
  assert(
    !sub.group_id || sub.group_id === lesson.group_id,
    409,
    "SUBSCRIPTION_GROUP",
    "Subscription does not apply to this group",
  );
  assert(
    !sub.subject || sub.subject === lesson.subject,
    409,
    "SUBSCRIPTION_SUBJECT",
    "Subscription does not apply to this subject",
  );
}
