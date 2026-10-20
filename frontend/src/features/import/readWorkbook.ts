export type ImportType = "clients" | "leads" | "employees";
export const columns: Record<ImportType, string[]> = {
  clients: ["name", "contact"],
  leads: ["name", "contact", "source", "description"],
  employees: ["full_name", "email", "password", "contact"],
};
export async function readWorkbook(file: File, type: ImportType) {
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    throw new Error(
      "Нужен файл .xlsx. Старый .xls сохраните в Excel как .xlsx.",
    );
  if (file.size > 2 * 1024 * 1024)
    throw new Error("Размер файла не должен превышать 2 МБ");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 201)
    throw new Error(
      "На первом листе должно быть от 1 до 200 строк данных и строка заголовков",
    );
  const headers = Array.from({ length: sheet.columnCount }, (_, i) =>
    String(sheet.getRow(1).getCell(i + 1).text).trim(),
  );
  if (
    new Set(headers).size !== headers.length ||
    headers.some((header) => !columns[type].includes(header))
  )
    throw new Error(
      `Допустимые уникальные заголовки: ${columns[type].join(", ")}`,
    );
  const required =
    type === "employees"
      ? ["full_name", "email", "password"]
      : type === "leads"
        ? ["name", "contact"]
        : ["name"];
  if (required.some((key) => !headers.includes(key)))
    throw new Error(`Обязательные столбцы: ${required.join(", ")}`);
  const rows: Record<string, string>[] = [];
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      const cell = sheet.getRow(n).getCell(i + 1);
      if (cell.formula)
        throw new Error(`Строка ${n}: замените формулу значением`);
      row[header] = cell.text.trim();
    });
    if (Object.values(row).every((value) => !value)) continue;
    if (required.some((key) => !row[key]))
      throw new Error(`Строка ${n}: заполните ${required.join(", ")}`);
    rows.push(row);
  }
  if (!rows.length) throw new Error("Нет строк для импорта");
  return rows;
}
