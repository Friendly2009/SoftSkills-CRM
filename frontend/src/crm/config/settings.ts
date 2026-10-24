import type { Field } from "../interfaces/common";
export interface SettingsSection {
  group: string;
  name: string;
  fields?: Field[];
  dictionary?: boolean;
}
const text = (key: string, label: string): Field => ({ key, label });
export const settingsSections: SettingsSection[] = [
  {
    group: "Основные",
    name: "Основные настройки",
    fields: [
      text("name", "Название организации"),
      text("address", "Адрес"),
      { key: "currency", label: "Валюта", options: ["Рубль", "Тенге", "Евро"] },
      {
        key: "timezone",
        label: "Часовой пояс",
        options: [
          "Москва (UTC+3)",
          "Екатеринбург (UTC+5)",
          "Новосибирск (UTC+7)",
        ],
      },
      { key: "language", label: "Язык", options: ["Русский"] },
    ],
  },
  { group: "Основные", name: "Филиалы", dictionary: true },
  {
    group: "Основные",
    name: "Юридические реквизиты",
    fields: [
      text("name", "Название"),
      text("inn", "ИНН"),
      text("kpp", "КПП"),
      text("bank", "Банк"),
      text("account", "Расчётный счёт"),
    ],
  },
  { group: "Клиенты", name: "Источники клиентов", dictionary: true },
  { group: "Клиенты", name: "Статусы клиентов", dictionary: true },
  { group: "Клиенты", name: "Поля клиентов", dictionary: true },
  { group: "Клиенты", name: "Метки", dictionary: true },
  { group: "Продажи", name: "Этапы воронки", dictionary: true },
  { group: "Продажи", name: "Причины отказов", dictionary: true },
  {
    group: "Продажи",
    name: "Настройки лидов",
    fields: [
      {
        key: "duplicate",
        label: "Проверять дубликаты по телефону",
        type: "checkbox",
      },
      {
        key: "assign",
        label: "Автоматически назначать ответственного",
        type: "checkbox",
      },
    ],
  },
  { group: "Уроки", name: "Предметы", dictionary: true },
  { group: "Уроки", name: "Типы уроков", dictionary: true },
  { group: "Уроки", name: "Аудитории", dictionary: true },
  { group: "Уроки", name: "Причины пропусков", dictionary: true },
  {
    group: "Уроки",
    name: "Календарь",
    fields: [
      { key: "start", label: "Начало рабочего дня", type: "time" },
      { key: "end", label: "Конец рабочего дня", type: "time" },
      { key: "weekends", label: "Показывать выходные", type: "checkbox" },
    ],
  },
  { group: "Финансы", name: "Статьи доходов и расходов", dictionary: true },
  { group: "Финансы", name: "Счета и кассы", dictionary: true },
  { group: "Финансы", name: "Способы оплаты", dictionary: true },
  {
    group: "Финансы",
    name: "Расчёт зарплаты",
    fields: [
      {
        key: "mode",
        label: "Способ расчёта",
        options: ["За урок", "За ученика", "Процент от оплаты"],
      },
      { key: "rate", label: "Базовая ставка", type: "number", min: 0 },
    ],
  },
  { group: "Документы", name: "Шаблоны документов", dictionary: true },
  { group: "Документы", name: "Шаблоны уведомлений", dictionary: true },
  {
    group: "Автоматизация",
    name: "Напоминания",
    fields: [
      { key: "enabled", label: "Напоминать о занятиях", type: "checkbox" },
      { key: "hours", label: "За сколько часов", type: "number", min: 1 },
      { key: "message", label: "Текст напоминания", type: "textarea" },
    ],
  },
  {
    group: "Интеграции",
    name: "Почта и SMS",
    fields: [
      text("sender", "Имя отправителя"),
      text("email", "Адрес отправителя"),
    ],
  },
];
