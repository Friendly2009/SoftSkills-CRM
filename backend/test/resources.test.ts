import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { peakOccupancy } from "../src/modules/enrollments.js";
import { email, contacts, pageQuery } from "../src/core/validation.js";
import { needsVersion } from "../src/core/records.js";
test("membership sweep handles adjacent periods, gaps and open ends", () => {
  const p = (start: number, end: number | null) => ({
    starts_at: `2030-01-0${start}T00:00:00Z`,
    ends_at: end ? `2030-01-0${end}T00:00:00Z` : null,
  });
  assert.equal(peakOccupancy([p(1, 2), p(2, 3), p(4, null)]), 1);
  assert.equal(peakOccupancy([p(1, 3), p(2, 4), p(2, null)]), 3);
});
test("contacts normalize before validation and reject duplicate normalized inputs", () => {
  assert.equal(email.parse("  USER@Example.COM  "), "user@example.com");
  assert.equal(
    contacts.safeParse([
      { kind: "phone", value: "8 (999) 123-45-67" },
      { kind: "phone", value: "+79991234567" },
    ]).success,
    false,
  );
  assert.equal(
    pageQuery.safeParse({ sortBy: "id; DROP TABLE crm_people" }).success,
    false,
  );
  assert.equal(pageQuery.safeParse({ pageSize: 101 }).success, false);
});
test("version contract covers edits, archive, conversion, exit and profile", () => {
  for (const [m, p] of [
    ["patch", "/people/:id"],
    ["post", "/leads/:id/convert"],
    ["post", "/groups/:id/archive"],
    ["delete", "/groups/:id/members/:studentId"],
    ["patch", "/profile"],
  ])
    assert.equal(needsVersion(m!, p!), true);
  assert.equal(needsVersion("get", "/organization/archive"), false);
  assert.equal(needsVersion("get", "/leads/:id/convert"), false);
  assert.equal(needsVersion("post", "/groups/:id/members"), false);
  assert.equal(needsVersion("post", "/people/:id/comments"), false);
});
