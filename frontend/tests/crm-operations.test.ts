import { describe, it, expect } from "vitest";
import { createSeed } from "../src/crm/mocks/data/seed";
import {
  saveRecord,
  topUp,
  closeLesson,
  moveLead,
} from "../src/crm/mocks/services/operations";
import { parseCsv } from "../src/crm/utils/csv";
describe("CRM mock business operations", () => {
  it("credits once for an identical payment key", () => {
    const db = createSeed();
    topUp(db, "c1", 500, "payment");
    topUp(db, "c1", 500, "payment");
    expect(db.records.clients[0].balance).toBe(5300);
    expect(
      db.records.transactions.filter((t) => t.requestKey === "payment"),
    ).toHaveLength(1);
  });
  it("rejects invalid payments without changing balance", () => {
    const db = createSeed();
    for (const amount of [-1, 0, NaN, Infinity])
      expect(() => topUp(db, "c1", amount, "key")).toThrow();
    expect(db.records.clients[0].balance).toBe(4800);
  });
  it("closes attendance once, debits only attendees and records teacher pay once", () => {
    const db = createSeed();
    closeLesson(db, "lesson1", ["c1", "c1"]);
    closeLesson(db, "lesson1", ["c1", "c2"]);
    expect(db.records.clients[0].balance).toBe(4000);
    expect(db.records.clients[1].balance).toBe(-800);
    expect(db.records.lessons[0].attendance).toEqual(["c1"]);
    expect(
      db.records.transactions.filter((t) => t.lessonId === "lesson1"),
    ).toHaveLength(1);
  });
  it("rejects an unrelated student before any charge", () => {
    const db = createSeed();
    expect(() => closeLesson(db, "lesson1", ["c1", "c3"])).toThrow();
    expect(db.records.clients[0].balance).toBe(4800);
    expect(db.records.lessons[0].status).toBe("Запланирован");
  });
  it("converts a lead into a single linked client across stage changes", () => {
    const db = createSeed();
    moveLead(db, "l1", "Получена оплата");
    const clientId = db.records.leads[0].clientId;
    moveLead(db, "l1", "Назначен контакт");
    moveLead(db, "l1", "Получена оплата");
    expect(db.records.clients).toHaveLength(5);
    expect(db.records.leads[0].clientId).toBe(clientId);
  });
  it("reconciles client balance when editing a payment", () => {
    const db = createSeed();
    const row = saveRecord(db, "transactions", {
      name: "Оплата",
      date: "2026-10-16",
      amount: 100,
      clientId: "c1",
      status: "Приход",
      category: "Оплата обучения",
    });
    expect(db.records.clients[0].balance).toBe(4900);
    saveRecord(db, "transactions", { ...row, amount: 300 }, row.id);
    expect(db.records.clients[0].balance).toBe(5100);
  });
  it("validates forms and removes credentials from mock storage", () => {
    const db = createSeed();
    expect(() => saveRecord(db, "clients", { name: "Тест" })).toThrow();
    expect(() =>
      saveRecord(db, "lessons", {
        name: "Урок",
        date: "2026-10-16",
        start: "18:00",
        end: "17:00",
      }),
    ).toThrow();
    const user = saveRecord(db, "users", {
      name: "Администратор",
      email: "test@example.test",
      role: "Администратор",
      password: "never-store",
    });
    expect(user.password).toBeUndefined();
  });
  it("parses escaped quotes and line breaks in CSV", () => {
    expect(
      parseCsv('\uFEFFname;comment\r\n"Анна; Ирина";"Строка 1\n""цитата"""'),
    ).toEqual([
      ["name", "comment"],
      ["Анна; Ирина", 'Строка 1\n"цитата"'],
    ]);
    expect(() => parseCsv('name\n"incomplete')).toThrow();
  });
});
