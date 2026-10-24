import type { CrmRecord, MockDatabase, Entity } from "../../interfaces/common";
import { dateKey, shiftDate } from "../../utils/format";
/** MOCK_API: Replace fixtures with initial reads from the backend; seed only once per browser. */
export function createSeed(): MockDatabase {
  const today = dateKey(new Date());
  const row = (
    id: string,
    name: string,
    status: string,
    rest: Record<string, string | number | boolean | string[]> = {},
  ): CrmRecord => ({
    id,
    name,
    status,
    createdAt: new Date().toISOString(),
    ...rest,
  });
  const records: Record<Entity, CrmRecord[]> = {
    teachers: [
      row("t1", "Анна Соколова", "Работает", {
        phone: "+7 900 111-22-33",
        email: "anna@example.test",
        subject: "Английский язык",
        rate: 1500,
      }),
      row("t2", "Михаил Орлов", "Работает", {
        phone: "+7 900 444-55-66",
        email: "mikhail@example.test",
        subject: "Математика",
        rate: 1800,
      }),
    ],
    groups: [
      row("g1", "Английский · A2", "Активна", {
        teacherId: "t1",
        subject: "Английский язык",
        capacity: 8,
        startDate: shiftDate(today, -30),
        endDate: shiftDate(today, 90),
        room: "Аудитория 1",
      }),
      row("g2", "Математика · 9 класс", "Идёт набор", {
        teacherId: "t2",
        subject: "Математика",
        capacity: 6,
        startDate: today,
        endDate: shiftDate(today, 90),
        room: "Аудитория 2",
      }),
    ],
    clients: [
      row("c1", "Александра Миронова", "Активен", {
        phone: "+7 900 123-45-67",
        email: "alexandra@example.test",
        balance: 4800,
        groupId: "g1",
        source: "Рекомендация",
        birthday: "2007-04-14",
      }),
      row("c2", "Даниил Волков", "Активен", {
        phone: "+7 900 234-56-78",
        email: "daniil@example.test",
        balance: -800,
        groupId: "g1",
        source: "Сайт",
        birthday: "2008-09-12",
      }),
      row("c3", "Мария Лебедева", "Пробный", {
        phone: "+7 900 345-67-89",
        email: "maria@example.test",
        balance: 0,
        groupId: "g2",
        source: "Звонок",
        birthday: "2009-01-25",
      }),
      row("c4", "Артём Смирнов", "Активен", {
        phone: "+7 900 456-78-90",
        email: "artem@example.test",
        balance: 3200,
        groupId: "g2",
        source: "Сайт",
        birthday: "2008-07-06",
      }),
    ],
    leads: [
      row("l1", "Елена Новикова", "Не разобран", {
        phone: "+7 900 567-89-01",
        email: "elena@example.test",
        source: "Сайт",
        teacherId: "t1",
        comment: "Интересует английский по вечерам",
      }),
      row("l2", "Иван Морозов", "Назначен контакт", {
        phone: "+7 900 678-90-12",
        email: "ivan@example.test",
        source: "Рекомендация",
        teacherId: "t2",
        comment: "Связаться после 18:00",
      }),
      row("l3", "Софья Павлова", "Назначена проба", {
        phone: "+7 900 789-01-23",
        email: "sofia@example.test",
        source: "Звонок",
        teacherId: "t1",
        comment: "Пробный урок в пятницу",
      }),
    ],
    tasks: [
      row("task1", "Позвонить Елене по заявке", "Новая", {
        date: today,
        teacherId: "t1",
        priority: "Высокий",
        comment: "Уточнить удобное время занятий",
      }),
      row("task2", "Подготовить материалы", "В работе", {
        date: shiftDate(today, 1),
        teacherId: "t2",
        priority: "Обычный",
      }),
    ],
    subscriptions: [
      row("s1", "Английский — 8 занятий", "Действует", {
        price: 6400,
        lessons: 8,
        days: 30,
        subject: "Английский язык",
      }),
      row("s2", "Математика — 4 занятия", "Действует", {
        price: 4000,
        lessons: 4,
        days: 30,
        subject: "Математика",
      }),
    ],
    companies: [
      row("co1", "ООО «Образование»", "Активна", {
        inn: "7700000000",
        kpp: "770001001",
        contact: "Ирина Петрова",
        phone: "+7 900 890-12-34",
        address: "Москва, ул. Учебная, 12",
        bank: "Демонстрационный банк",
        account: "00000000000000000000",
      }),
    ],
    users: [
      row("u1", "Кирилл", "Активен", {
        email: "kirill@example.test",
        role: "Администратор",
        phone: "+7 900 000-00-00",
      }),
      row("u2", "Анна Соколова", "Активен", {
        email: "anna@example.test",
        role: "Педагог",
        phone: "+7 900 111-22-33",
      }),
    ],
    lessons: [
      row("lesson1", "Английский · A2", "Запланирован", {
        groupId: "g1",
        teacherId: "t1",
        date: today,
        start: "16:00",
        end: "17:00",
        room: "Аудитория 1",
        rate: 800,
        pay: 1500,
        attendance: [],
      }),
      row("lesson2", "Подготовка к ОГЭ", "Запланирован", {
        groupId: "g2",
        teacherId: "t2",
        date: today,
        start: "18:00",
        end: "19:30",
        room: "Аудитория 2",
        rate: 1000,
        pay: 1800,
        attendance: [],
      }),
      row("lesson3", "Разговорная практика", "Запланирован", {
        groupId: "g1",
        teacherId: "t1",
        date: shiftDate(today, 2),
        start: "15:00",
        end: "16:00",
        room: "Аудитория 1",
        rate: 800,
        pay: 1500,
        attendance: [],
      }),
    ],
    transactions: [
      row("tr1", "Оплата абонемента", "Приход", {
        clientId: "c1",
        amount: 6400,
        date: shiftDate(today, -3),
        category: "Оплата обучения",
        account: "Расчётный счёт",
      }),
      row("tr2", "Аренда за месяц", "Расход", {
        clientId: "",
        amount: 2500,
        date: shiftDate(today, -2),
        category: "Аренда",
        account: "Расчётный счёт",
      }),
    ],
  };
  return {
    version: 1,
    records,
    activity: [],
    settings: {
      "Основные настройки": {
        name: "Учебный центр",
        currency: "Рубль",
        language: "Русский",
        rounding: "Математическое",
      },
    },
    dictionaries: Object.fromEntries(
      Object.entries({
        "Источники клиентов": ["Сайт", "Рекомендация", "Звонок"],
        Предметы: ["Английский язык", "Математика"],
        Аудитории: ["Аудитория 1", "Аудитория 2"],
      }).map(([key, names]) => [
        key,
        names.map((name, i) => ({
          id: key + i,
          name,
          color: "#35b3c3",
          description: "",
        })),
      ]),
    ),
    widgets: ["lessons", "sales", "finance", "attendance"],
    notifications: [
      { id: "n1", text: "Сегодня запланировано 2 занятия", read: false },
      { id: "n2", text: "Новая заявка: Елена Новикова", read: false },
    ],
    profile: {
      name: "Кирилл",
      email: "kirill@example.test",
      phone: "+7 900 000-00-00",
    },
    aiBalance: 0,
  };
}
