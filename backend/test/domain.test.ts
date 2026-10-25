import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  amount,
  normalizePhone,
  money,
  date,
  contacts,
} from "../src/core/validation.js";
import {
  hashPassword,
  verifyPassword,
  branch,
  permit,
} from "../src/core/security.js";
import { inspectZip, parseWorkbook } from "../src/modules/imports.js";
import ExcelJS from "exceljs";
test("exact money and discount at integer precision boundary", () => {
  assert.equal(amount("999999999999", "123456789012"), "876543210987");
  assert.equal(amount("101", "100"), "1");
  assert.throws(() => amount("1", "2"));
  for (const invalid of [
    "1.01",
    "-1",
    "01",
    "1e2",
    12,
    Number.MAX_SAFE_INTEGER,
  ])
    assert.equal(money.safeParse(invalid).success, false);
});
test("contact normalization and real calendar validation", () => {
  assert.equal(normalizePhone("8 (999) 123-45-67"), "+79991234567");
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.throws(() => normalizePhone("123"));
  assert.deepEqual(
    contacts.parse([{ kind: "email", value: "USER@Example.com" }]),
    [{ kind: "email", value: "user@example.com" }],
  );
  assert.equal(date.safeParse("2025-02-29").success, false);
  assert.equal(date.safeParse("2024-02-29").success, true);
});
test("password hashes salted, verified without storing plaintext", async () => {
  const first = await hashPassword("A long unique password");
  const second = await hashPassword("A long unique password");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("A long unique password", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
});
test("roles and explicit branch restrictions fail closed", () => {
  const actor = {
    id: "a",
    org: "o",
    personId: "p",
    roles: ["manager"],
    branches: ["one"],
  };
  branch(actor, "one");
  permit(actor, "manager");
  assert.throws(() => branch(actor, "two"));
  assert.throws(() => permit(actor, "director"));
  branch({ ...actor, roles: ["director"] }, "two");
});
test("xlsx parser accepts values and rejects formulas and ZIP bombs", async () => {
  const w = new ExcelJS.Workbook();
  const s = w.addWorksheet("People");
  s.addRow(["name", "phone"]);
  s.addRow(["Child", "89991234567"]);
  const bytes = Buffer.from(await w.xlsx.writeBuffer());
  assert.deepEqual(await parseWorkbook(bytes.toString("base64")), [
    { name: "Child", phone: "89991234567" },
  ]);
  s.getCell("B2").value = { formula: "1+1", result: 2 };
  const encoded = Buffer.from(await w.xlsx.writeBuffer()).toString("base64");
  await assert.rejects(() => parseWorkbook(encoded), /formulas/);
  const bomb = Buffer.from(bytes);
  const pos = bomb.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  bomb.writeUInt32LE(100 * 1024 * 1024, pos + 24);
  assert.throws(() => inspectZip(bomb), /8 MiB/);
  assert.throws(() => inspectZip(Buffer.from("not zip")));
});
