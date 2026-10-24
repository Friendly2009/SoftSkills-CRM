import type {
  Entity,
  MockDatabase,
  RecordDraft,
  CrmRecord,
} from "../../interfaces/common";
import { modules } from "../../config/modules";
export type Mutation = (db: MockDatabase) => void;
/** MOCK_API: validate and save an entity; replace with the matching request contract. */
export function saveRecord(
  db: MockDatabase,
  entity: Entity,
  draft: RecordDraft,
  id?: string,
): CrmRecord {
  const config = modules[entity];
  for (const field of config.fields) {
    if (field.required && !String(draft[field.key] ?? "").trim())
      throw new Error(`Заполните поле «${field.label}»`);
    if (
      field.type === "number" &&
      draft[field.key] !== undefined &&
      (!Number.isFinite(Number(draft[field.key])) ||
        Number(draft[field.key]) < (field.min ?? -Infinity))
    )
      throw new Error(`Проверьте поле «${field.label}»`);
    if (
      field.relation &&
      draft[field.key] &&
      !db.records[field.relation].some((r) => r.id === draft[field.key])
    )
      throw new Error("Связанная запись не найдена");
  }
  if (entity === "lessons" && String(draft.end) <= String(draft.start))
    throw new Error("Окончание должно быть позже начала");
  if (
    entity === "groups" &&
    draft.startDate &&
    draft.endDate &&
    String(draft.endDate) < String(draft.startDate)
  )
    throw new Error("Проверьте даты группы");
  if (draft.status && !config.statuses.includes(String(draft.status)))
    throw new Error("Неизвестный статус");
  const previous = db.records[entity].find((r) => r.id === id);
  if (entity === "lessons" && previous?.status === "Проведён")
    throw new Error("Проведённый урок доступен только для чтения");
  const clean = { ...draft };
  delete clean.password;
  const row = {
    balance: 0,
    ...previous,
    ...clean,
    id: id ?? crypto.randomUUID(),
    createdAt: previous?.createdAt ?? new Date().toISOString(),
    name: String(draft.name),
    status: String(draft.status || config.statuses[0]),
  } as CrmRecord;
  if (entity === "transactions") {
    if (Number(row.amount) <= 0)
      throw new Error("Сумма должна быть больше нуля");
    const apply = (r: CrmRecord, sign: number) => {
      if (
        r.clientId &&
        r.status === "Приход" &&
        r.category === "Оплата обучения"
      ) {
        const c = db.records.clients.find((c) => c.id === r.clientId);
        if (c)
          c.balance =
            Math.round(
              (Number(c.balance || 0) + sign * Number(r.amount)) * 100,
            ) / 100;
      }
    };
    if (previous) apply(previous, -1);
    apply(row, 1);
  }
  if (previous)
    db.records[entity] = db.records[entity].map((r) => (r.id === id ? row : r));
  else db.records[entity].unshift(row);
  addActivity(
    db,
    entity,
    row.id,
    previous ? "Изменена запись" : "Создана запись",
  );
  return row;
}
/** MOCK_API: append a record timeline event. */
export function addActivity(
  db: MockDatabase,
  entity: Entity,
  recordId: string,
  text: string,
) {
  db.activity.unshift({
    id: crypto.randomUUID(),
    entity,
    recordId,
    text,
    date: new Date().toISOString(),
  });
}
/** MOCK_API: post a payment and credit the client atomically; request key prevents repeated submits. */
export function topUp(
  db: MockDatabase,
  clientId: string,
  amount: number,
  key: string,
) {
  if (db.records.transactions.some((t) => t.requestKey === key)) return;
  const client = db.records.clients.find((c) => c.id === clientId);
  if (!client) throw new Error("Клиент не найден");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Сумма должна быть больше нуля");
  client.balance =
    Math.round((Number(client.balance || 0) + amount) * 100) / 100;
  db.records.transactions.unshift({
    id: crypto.randomUUID(),
    name: `Оплата: ${client.name}`,
    status: "Приход",
    createdAt: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    amount,
    clientId,
    category: "Оплата обучения",
    account: "Касса",
    requestKey: key,
  });
  addActivity(db, "clients", clientId, `Пополнение баланса: ${amount} ₽`);
}
/** MOCK_API: close a lesson and debit attendees in one transaction, only once. */
export function closeLesson(
  db: MockDatabase,
  id: string,
  attendance: string[],
) {
  const lesson = db.records.lessons.find((l) => l.id === id);
  if (!lesson) throw new Error("Урок не найден");
  if (lesson.status === "Проведён") return;
  if (lesson.status === "Отменён") throw new Error("Урок отменён");
  const unique = [...new Set(attendance)];
  for (const cid of unique) {
    const c = db.records.clients.find(
      (c) => c.id === cid && c.groupId === lesson.groupId,
    );
    if (!c) throw new Error("Ученик не состоит в группе");
  }
  for (const cid of unique) {
    const c = db.records.clients.find((c) => c.id === cid)!;
    c.balance =
      Math.round((Number(c.balance || 0) - Number(lesson.rate || 0)) * 100) /
      100;
    addActivity(
      db,
      "clients",
      cid,
      `Списание за урок «${lesson.name}»: ${lesson.rate} ₽`,
    );
  }
  if (Number(lesson.pay) > 0)
    db.records.transactions.unshift({
      id: crypto.randomUUID(),
      name: `Оплата педагогу: ${lesson.name}`,
      status: "Расход",
      createdAt: new Date().toISOString(),
      date: String(lesson.date),
      amount: Number(lesson.pay),
      category: "Зарплата",
      account: "Касса",
      lessonId: id,
    });
  lesson.status = "Проведён";
  lesson.attendance = unique;
  addActivity(db, "lessons", id, "Урок проведён, посещаемость сохранена");
}
/** MOCK_API: change lead stage and create exactly one client on conversion. */
export function moveLead(db: MockDatabase, id: string, status: string) {
  const lead = db.records.leads.find((l) => l.id === id);
  if (!lead) throw new Error("Лид не найден");
  lead.status = status;
  if (status === "Получена оплата" && !lead.clientId) {
    const client = saveRecord(db, "clients", {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      source: lead.source || "",
      status: "Активен",
      balance: 0,
    });
    lead.clientId = client.id;
  }
  addActivity(db, "leads", id, `Этап: ${status}`);
}
