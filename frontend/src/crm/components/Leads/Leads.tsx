import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, Columns3, Phone } from "lucide-react";
import { useCrm } from "../../mocks/store/CrmProvider";
import { modules } from "../../config/modules";

import { Button } from "../ui";
import { RecordForm } from "../Clients/components/RecordForm";
import { EntityWorkspace } from "../Clients/EntityWorkspace";
export function Leads() {
  const { db, mutate } = useCrm();
  const nav = useNavigate();
  const [list, setList] = useState(false),
    [create, setCreate] = useState(false),
    [search, setSearch] = useState("");
  return (
    <>
      <div className="crm-page-heading">
        <h1>Лиды</h1>
        <span>{db.records.leads.length} заявок</span>
        <div className="flex-1" />
        <Button onClick={() => setList(!list)}>
          {list ? <Columns3 size={16} /> : <List size={16} />}
          {list ? "Воронка" : "Список"}
        </Button>
      </div>
      {list ? (
        <EntityWorkspace entity="leads" compact />
      ) : (
        <>
          <div className="crm-toolbar">
            <Button primary onClick={() => setCreate(true)}>
              <Plus size={15} />
              Добавить лид
            </Button>
            <input
              aria-label="Поиск лидов"
              placeholder="Поиск по имени или телефону"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="crm-hint">Перетащите карточку на нужный этап</span>
          </div>
          <div className="crm-kanban">
            {modules.leads.statuses.map((s, i) => {
              const rows = db.records.leads.filter(
                (l) =>
                  l.status === s &&
                  `${l.name} ${l.phone}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              );
              return (
                <section
                  key={s}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id)
                      (await mutate({ type: 'lead.move', id, status: s }));
                  }}
                >
                  <header
                    style={{
                      borderTopColor: [
                        "#6cc7d2",
                        "#7da9dc",
                        "#d9bc6b",
                        "#a697cc",
                        "#8bbb78",
                        "#c69c9c",
                      ][i],
                    }}
                  >
                    {s}
                    <span>{rows.length}</span>
                  </header>
                  <div className="p-2 space-y-2">
                    {rows.map((l) => (
                      <article
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", l.id)
                        }
                        key={l.id}
                        className="crm-lead-card"
                      >
                        <button
                          className="crm-link text-left font-medium"
                          onClick={() => nav(`/dashboard/leads/${l.id}`)}
                        >
                          {l.name}
                        </button>
                        <p className="text-xs text-slate-400 mt-2">
                          {String(l.source)}
                        </p>
                        <p className="flex items-center gap-2 mt-4 text-xs">
                          <Phone size={12} />
                          {String(l.phone)}
                        </p>
                        <p className="text-xs text-slate-500 mt-3">
                          {String(l.comment || "Нет комментария")}
                        </p>
                        <select
                          aria-label={`Этап: ${l.name}`}
                          className="mt-4 w-full text-xs"
                          value={s}
                          onChange={async (e) =>
                            (await mutate({ type: 'lead.move', id: l.id, status: e.target.value }))
                          }
                        >
                          {modules.leads.statuses.map((stage) => (
                            <option key={stage}>{stage}</option>
                          ))}
                        </select>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {create && <RecordForm entity="leads" onClose={() => setCreate(false)} />}
    </>
  );
}
