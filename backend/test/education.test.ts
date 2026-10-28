import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { lessonDiscount, timeZone } from "../src/modules/educationRules.js";
import {
  lessonSchema,
  assertSubscriptionScope,
} from "../src/modules/education.js";
test("percentage rounds final payable half up using integer arithmetic", () => {
  assert.equal(lessonDiscount("1", undefined, 5000), "0");
  assert.equal(lessonDiscount("3", undefined, 5000), "1");
  assert.equal(lessonDiscount("10001", undefined, 3333), "3333");
  assert.equal(
    lessonDiscount("999999999999", undefined, 10000),
    "999999999999",
  );
  assert.equal(lessonDiscount("999999999999", undefined, 0), "0");
  assert.equal(lessonDiscount("0", undefined, 10000), "0");
  assert.equal(lessonDiscount("100", "100"), "100");
  for (const fn of [
    () => lessonDiscount("10", "11"),
    () => lessonDiscount("10", "0", 0),
    () => lessonDiscount("10", undefined, 10001),
    () => lessonDiscount("10", undefined, 1.5),
  ])
    assert.throws(fn);
});
test("lesson validates timezone, exact intervals and mutually exclusive discounts", () => {
  const b = {
    branchId: randomUUID(),
    teacherId: randomUUID(),
    roomId: randomUUID(),
    name: "Lesson",
    basePrice: "101",
    timezone: "Europe/Moscow",
    startsAt: "2026-03-29T01:00:00+01:00",
    endsAt: "2026-03-29T03:00:00+02:00",
    attendees: [{ studentId: randomUUID(), discountPercent: 5000 }],
  };
  assert.equal(lessonSchema.parse(b).startsAt, "2026-03-29T00:00:00.000Z");
  assert.equal(timeZone.safeParse("Mars/Phobos").success, false);
  assert.equal(
    lessonSchema.safeParse({ ...b, endsAt: b.startsAt }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({ ...b, endsAt: "2026-03-28T01:00:00Z" }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({
      ...b,
      attendees: [{ ...b.attendees[0], discount: "0" }],
    }).success,
    false,
  );
  assert.equal(
    lessonSchema.safeParse({
      ...b,
      attendees: [b.attendees[0], b.attendees[0]],
    }).success,
    false,
  );
});
test("subscription scope requires both selected group and subject", () => {
  assert.doesNotThrow(() =>
    assertSubscriptionScope(
      { group_id: null, subject: "Math" },
      { group_id: null, subject: "Math" },
    ),
  );
  assert.throws(() =>
    assertSubscriptionScope(
      { group_id: "a", subject: "Math" },
      { group_id: "b", subject: "Math" },
    ),
  );
  assert.throws(() =>
    assertSubscriptionScope(
      { group_id: null, subject: "Math" },
      { subject: "Music" },
    ),
  );
});
