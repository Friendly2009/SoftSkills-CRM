/** Export visible entity rows to a UTF-8 CSV, neutralizing spreadsheet formula prefixes. */
export function downloadCsv(name: string, headers: string[], rows: string[][]) {
  const quote = (s: string) =>
    '"' + (/^[=+@-]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"';
  const content =
    "\uFEFF" +
    [headers, ...rows].map((r) => r.map(quote).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Read quoted CSV fields, including escaped quotes, semicolons and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ";" && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Незакрытая кавычка CSV");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
