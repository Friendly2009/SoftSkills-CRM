import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  Upload,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import type { Entity, CrmRecord, RecordDraft } from "../../interfaces/common";
import { modules } from "../../config/modules";
import { useCrm } from "../../mocks/store/CrmProvider";

import { Button, Modal, Badge, Empty } from "../ui";
import { RecordForm } from "./components/RecordForm";
import { downloadCsv, parseCsv } from "../../utils/csv";
import { money } from "../../utils/format";
export function EntityWorkspace({
  entity,
  compact = false,
}: {
  entity: Entity;
  compact?: boolean;
}) {
  const { db, mutate, notify } = useCrm();
  const nav = useNavigate();
  const config = modules[entity];
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [sort, setSort] = useState("name"),
    [desc, setDesc] = useState(false),
    [columns, setColumns] = useState(config.columns),
    [selected, setSelected] = useState<string[]>([]),
    [dialog, setDialog] = useState("");
  const value = (r: CrmRecord, key: string) => {
    const field = config.fields.find((f) => f.key === key);
    if (field?.relation)
      return (
        db.records[field.relation].find((x) => x.id === r[key])?.name || "—"
      );
    if (["balance", "amount", "price", "rate", "pay"].includes(key))
      return money(Number(r[key] || 0));
    return String(r[key] ?? "—");
  };
  const label = (key: string) =>
    key === "status"
      ? "Статус"
      : key === "balance"
        ? "Баланс"
        : config.fields.find((f) => f.key === key)?.label || key;
  const filtered = useMemo(
    () =>
      db.records[entity]
        .filter(
          (r) =>
            (!status || r.status === status) &&
            Object.values(r)
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort(
          (a, b) =>
            (typeof a[sort] === "number" && typeof b[sort] === "number"
              ? Number(a[sort]) - Number(b[sort])
              : String(a[sort] ?? "").localeCompare(
                  String(b[sort] ?? ""),
                  "ru",
                )) * (desc ? -1 : 1),
        ),
    [db, entity, status, search, sort, desc],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 15, currentPage * 15);
  /** MOCK_API: import a validated CSV batch into the local store atomically; replace with upload/import endpoint. */
  async function importFile(file: File) {
    try {
      const [headers, ...rows] = parseCsv(await file.text());
      if (!headers) throw new Error("Файл пуст");
      const fields = config.fields.filter((f) => f.type !== "password");
      const keys = headers.map(
        (h) =>
          fields.find((f) => f.label === h || f.key === h)?.key ||
          (h === "Статус" ? "status" : null),
      );
      if (!keys.includes("name"))
        throw new Error(
          "Нужен столбец «Название» или name. Используйте экспорт как образец.",
        );
      (await mutate({ type: 'records.import', entity, rows: rows.map(row => { const draft: RecordDraft = {}; keys.forEach((k, i) => { if (k) draft[k] = fields.find(f => f.key === k)?.type === 'number' ? Number(row[i]) : row[i] || ''; }); return draft; }) }, `Импортировано записей: ${rows.length}`));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Ошибка импорта");
    }
  }
  return (
    <section>
      {!compact && (
        <div className="crm-page-heading">
          <h1>{config.title}</h1>
          <span>{filtered.length} записей</span>
        </div>
      )}
      <div className="crm-toolbar">
        <Button primary onClick={() => setDialog("create")}>
          <Plus size={15} />
          Добавить
        </Button>
        <label className="crm-search">
          <Search size={15} />
          <input
            aria-label="Поиск по списку"
            placeholder="Поиск"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Фильтр по статусу"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все статусы</option>
          {config.statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Button
          title="Экспорт CSV"
          onClick={() =>
            downloadCsv(
              config.title,
              columns.map(label),
              filtered.map((r) => columns.map((c) => value(r, c))),
            )
          }
        >
          <Download size={15} />
          Экспорт
        </Button>
        <Button onClick={() => setDialog("import")}>
          <Upload size={15} />
          Импорт
        </Button>
        <Button
          aria-label="Настроить столбцы"
          onClick={() => setDialog("columns")}
        >
          <SlidersHorizontal size={16} />
        </Button>
      </div>
      {selected.length > 0 && (
        <div className="crm-selection">
          Выбрано: {selected.length}
          <Button onClick={() => setDialog("archive")}>Изменить статус</Button>
          <Button onClick={() => setSelected([])}>Снять выделение</Button>
        </div>
      )}
      <div className="crm-panel overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Выбрать все на странице"
                  checked={
                    visible.length > 0 &&
                    visible.every((r) => selected.includes(r.id))
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visible.map((r) => r.id),
                            ]),
                          ]
                        : selected.filter(
                            (id) => !visible.some((r) => r.id === id),
                          ),
                    )
                  }
                />
              </th>
              {columns.map((c) => (
                <th key={c}>
                  <button
                    onClick={() => {
                      setSort(c);
                      setDesc(sort === c ? !desc : false);
                    }}
                  >
                    {label(c)}
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    aria-label={`Выбрать ${r.name}`}
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, r.id]
                          : selected.filter((id) => id !== r.id),
                      )
                    }
                  />
                </td>
                {columns.map((c, i) => (
                  <td key={c}>
                    {c === "status" ? (
                      <Badge>{r.status}</Badge>
                    ) : i === 0 ? (
                      <button
                        className="crm-link"
                        onClick={() => nav(`/dashboard/${entity}/${r.id}`)}
                      >
                        {value(r, c)}
                      </button>
                    ) : (
                      <span
                        className={
                          c === "balance" && Number(r.balance) < 0
                            ? "text-red-500"
                            : ""
                        }
                      >
                        {value(r, c)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <Empty />}
      </div>
      <div className="crm-pagination">
        <span>Всего: {filtered.length}</span>
        <div className="flex items-center gap-3">
          <Button
            aria-label="Предыдущая страница"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={15} />
          </Button>
          <span>
            {currentPage} / {pages}
          </span>
          <Button
            aria-label="Следующая страница"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
      {dialog === "create" && (
        <RecordForm entity={entity} onClose={() => setDialog("")} />
      )}
      {dialog === "columns" && (
        <Modal title="Столбцы таблицы" onClose={() => setDialog("")}>
          <div className="space-y-3">
            {[
              ...new Set([
                ...config.columns,
                ...config.fields
                  .filter((f) => f.type !== "password")
                  .map((f) => f.key),
              ]),
            ].map((c) => (
              <label className="flex gap-3" key={c}>
                <input
                  type="checkbox"
                  disabled={c === "name"}
                  checked={columns.includes(c)}
                  onChange={(e) =>
                    setColumns(
                      e.target.checked
                        ? [...columns, c]
                        : columns.filter((x) => x !== c),
                    )
                  }
                />
                {label(c)}
              </label>
            ))}
          </div>
          <div className="crm-form-footer">
            <Button primary onClick={() => setDialog("")}>
              Готово
            </Button>
          </div>
        </Modal>
      )}
      {dialog === "archive" && (
        <Modal title="Массовое изменение статуса" onClose={() => setDialog("")}>
          <p className="mb-4">Изменить {selected.length} записей:</p>
          <div className="flex flex-wrap gap-2">
            {config.statuses
              .filter((s) => entity !== "lessons" || s !== "Проведён")
              .map((s) => (
                <Button
                  key={s}
                  onClick={async () => {
                    if (
                      (await mutate({ type: 'records.status', entity, ids: selected, status: s }))
                    ) {
                      setDialog("");
                      setSelected([]);
                    }
                  }}
                >
                  {s}
                </Button>
              ))}
          </div>
        </Modal>
      )}
      {dialog === "import" && (
        <Modal title="Импорт CSV" onClose={() => setDialog("")}>
          <p className="crm-hint mb-4">
            UTF-8, разделитель — точка с запятой. Заголовки соответствуют
            названиям полей. Экспортируйте таблицу со всеми обязательными полями
            для образца. Связанные записи укажите по названию.
          </p>
          <input
            aria-label="Файл CSV"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void importFile(f);
                setDialog("");
              }
            }}
          />
        </Modal>
      )}
    </section>
  );
}
