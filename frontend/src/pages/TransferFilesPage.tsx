import { useAuth } from "@/app/AuthProvider";
import {
  columns,
  readWorkbook,
  type ImportType,
} from "@/features/import/readWorkbook";
import { errorMessage, jsonBody, request } from "@/shared/api/client";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { Link } from "react-router-dom";
export function TransferFilesPage() {
  const { profile } = useAuth();
  const [type, setType] = useState<ImportType>("clients");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [fileKey, setFileKey] = useState(0);
  async function selectFile(file?: File) {
    if (!file || busy) return;
    setBusy(true);
    setRows([]);
    setError("");
    setSuccess("");
    try {
      setRows(await readWorkbook(file, type));
    } catch (ex) {
      setError(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  }
  if (Number(profile?.rank) < 500)
    return <Alert>Недостаточно прав для импорта</Alert>;
  return (
    <main className="ui-page import-page">
      <Link to="/dashboard">← В CRM</Link>
      <h1>Импорт из Excel</h1>
      <p>
        Первый лист, до 200 строк. Добавляются новые записи; существующие не
        перезаписываются. Клиенты создаются с нулевым балансом, сотрудники — с
        ролью преподавателя.
      </p>
      <label>
        Категория
        <select
          disabled={busy}
          value={type}
          onChange={(e) => {
            setType(e.target.value as ImportType);
            setRows([]);
            setError("");
            setSuccess("");
            setFileKey((v) => v + 1);
          }}
        >
          <option value="clients">Клиенты</option>
          <option value="leads">Лиды</option>
          {Number(profile?.rank) >= 1000 && (
            <option value="employees">Сотрудники</option>
          )}
        </select>
      </label>
      <p>
        Заголовки столбцов: <code>{columns[type].join(", ")}</code>. Контакты
        храните в ячейках как текст.
      </p>
      <label
        className="import-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void selectFile(e.dataTransfer.files[0]);
        }}
      >
        Выберите или перетащите файл .xlsx, до 2 МБ
        <input
          key={fileKey}
          type="file"
          accept=".xlsx"
          disabled={busy}
          onChange={(e) => void selectFile(e.target.files?.[0])}
        />
      </label>
      {error && <Alert>{error}</Alert>}
      {success && (
        <p role="status" className="text-success">
          {success}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <p>
            Будет добавлено записей: {rows.length}. Предпросмотр первых пяти:
          </p>
          <div className="ui-table-scroll">
            <table className="ui-table">
              <thead>
                <tr>
                  {columns[type].map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {columns[type].map((column) => (
                      <td key={column}>
                        {column === "password"
                          ? "••••••••"
                          : row[column] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Button
        disabled={busy || rows.length === 0}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            const result = await request<{ count: number }>("/import", {
              method: "POST",
              ...jsonBody({ type, rows }),
            });
            setSuccess(`Добавлено записей: ${result.count}`);
            setRows([]);
            setFileKey((v) => v + 1);
          } catch (ex) {
            setError(errorMessage(ex));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Обработка…" : "Подтвердить импорт"}
      </Button>
    </main>
  );
}
