/** Render rubles consistently throughout the CRM. */
export const money = (value: unknown) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
/** Local calendar date; avoid UTC conversion shifting the day. */
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
/** Date labels use local midnight for date-only values. */
export const shortDate = (value: unknown) =>
  value
    ? new Date(String(value).slice(0, 10) + "T12:00:00").toLocaleDateString(
        "ru-RU",
      )
    : "—";
/** Shift a calendar day without mutating the input. */
export function shiftDate(value: string, days: number) {
  const d = new Date(value + "T12:00:00");
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
