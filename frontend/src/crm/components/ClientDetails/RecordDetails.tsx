import { Timeline } from "./components/Timeline";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Check, MessageSquare } from "lucide-react";
import type { Entity } from "../../interfaces/common";
import { modules } from "../../config/modules";
import { useCrm } from "../../mocks/store/CrmProvider";

import { money } from "../../utils/format";
import { Button, Modal, Badge, Empty } from "../ui";
import { RecordForm } from "../Clients/components/RecordForm";
export function RecordDetails({ entity }: { entity: Entity }) {
  const { id } = useParams();
  const { db, mutate } = useCrm();
  const nav = useNavigate();
  const record = db.records[entity].find((r) => r.id === id);
  const [dialog, setDialog] = useState(""),
    [tab, setTab] = useState("История"),
    [comment, setComment] = useState(""),
    [amount, setAmount] = useState("1000"),
    [attendance, setAttendance] = useState<string[]>([]),
    [paymentKey, setPaymentKey] = useState("");
  if (!record)
    return (
      <div className="crm-panel p-8">
        <p>Запись не найдена</p>
        <Button onClick={() => nav(`/dashboard/${entity}`)}>
          Вернуться к списку
        </Button>
      </div>
    );
  const config = modules[entity],
    history = db.activity.filter(
      (a) => a.entity === entity && a.recordId === id,
    );
  const students = db.records.clients.filter(
    (c) => c.groupId === record.groupId,
  );
  const related =
    entity === "groups"
      ? db.records.clients.filter((c) => c.groupId === id)
      : entity === "teachers"
        ? db.records.groups.filter((g) => g.teacherId === id)
        : entity === "clients"
          ? db.records.transactions.filter((t) => t.clientId === id)
          : [];
  const relatedEntity =
    entity === "groups"
      ? "clients"
      : entity === "teachers"
        ? "groups"
        : "transactions";
  return (
    <>
      <div className="crm-page-heading">
        <Button
          aria-label="Назад к списку"
          onClick={() =>
            nav(`/dashboard/${entity === "transactions" ? "finance" : entity}`)
          }
        >
          <ArrowLeft size={16} />
        </Button>
        <h1>{record.name}</h1>
        <Badge>{record.status}</Badge>
      </div>
      <div className="crm-toolbar">
        <Button
          onClick={() => setDialog("edit")}
          disabled={entity === "lessons" && record.status === "Проведён"}
        >
          <Pencil size={14} />
          Редактировать
        </Button>
        {entity === "clients" && (
          <Button
            primary
            onClick={() => {
              setPaymentKey(crypto.randomUUID());
              setDialog("payment");
            }}
          >
            <Plus size={14} />
            Принять оплату
          </Button>
        )}
        {entity === "lessons" && (
          <Button
            primary
            disabled={record.status !== "Запланирован"}
            onClick={() => {
              setAttendance(students.map((c) => c.id));
              setDialog("attendance");
            }}
          >
            <Check size={15} />
            Провести урок
          </Button>
        )}
        {entity === "leads" && (
          <select
            aria-label="Этап лида"
            value={record.status}
            onChange={async (e) =>
              (await mutate({ type: 'lead.move', id: record.id, status: e.target.value }))
            }
          >
            {config.statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
      <div className="crm-detail-grid">
        <div>
          <div className="crm-tabs">
            {["История", "Связанные записи"].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="crm-panel p-5">
            {tab === "История" ? (
              <>
                <form
                  className="mb-6"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      comment.trim() &&
                      (await mutate({ type: 'activity.add', entity, id: record.id, text: comment.trim() }, "Комментарий добавлен"))
                    )
                      setComment("");
                  }}
                >
                  <textarea
                    aria-label="Комментарий"
                    placeholder="Добавить комментарий…"
                    className="w-full"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button type="submit" primary disabled={!comment.trim()}>
                      <MessageSquare size={14} />
                      Добавить
                    </Button>
                  </div>
                </form>
                <Timeline
                  history={history}
                  createdAt={record.createdAt}
                  author={db.profile.name}
                />
              </>
            ) : related.length ? (
              <div className="divide-y divide-slate-100">
                {related.map((r) => (
                  <button
                    className="block py-3 crm-link"
                    key={r.id}
                    onClick={() => nav(`/dashboard/${relatedEntity}/${r.id}`)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            ) : (
              <Empty text="Связанных записей пока нет" />
            )}
          </div>
        </div>
        <aside className="crm-panel p-5">
          <h2 className="mb-5 font-medium">Основная информация</h2>
          {entity === "clients" && (
            <div className="crm-balance">
              <span>Баланс</span>
              <strong
                className={Number(record.balance) < 0 ? "text-red-500" : ""}
              >
                {money(Number(record.balance))}
              </strong>
            </div>
          )}
          <dl className="crm-properties">
            {config.fields
              .filter((f) => f.type !== "password")
              .map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.relation
                      ? db.records[f.relation].find(
                          (r) => r.id === record[f.key],
                        )?.name || "—"
                      : String(record[f.key] ?? "—")}
                  </dd>
                </div>
              ))}
          </dl>
        </aside>
      </div>
      {dialog === "edit" && (
        <RecordForm
          entity={entity}
          record={record}
          onClose={() => setDialog("")}
        />
      )}
      {dialog === "payment" && (
        <Modal title="Принять оплату" onClose={() => setDialog("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                (await mutate({ type: 'client.topUp', id: record.id, amount: Number(amount), key: paymentKey }, "Оплата принята"))
              )
                setDialog("");
            }}
          >
            <p className="mb-4">{record.name}</p>
            <label className="block">
              Сумма, ₽
              <input
                aria-label="Сумма оплаты"
                className="block w-full mt-2"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="crm-form-footer">
              <Button onClick={() => setDialog("")}>Отмена</Button>
              <Button type="submit" primary>
                Принять оплату
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === "attendance" && (
        <Modal
          title="Посещаемость и проведение урока"
          onClose={() => setDialog("")}
        >
          <p className="crm-hint mb-4">
            С баланса каждого присутствующего будет списано{" "}
            {money(Number(record.rate || 0))}.
          </p>
          {students.map((c) => (
            <label className="flex gap-3 py-2" key={c.id}>
              <input
                type="checkbox"
                checked={attendance.includes(c.id)}
                onChange={(e) =>
                  setAttendance(
                    e.target.checked
                      ? [...attendance, c.id]
                      : attendance.filter((x) => x !== c.id),
                  )
                }
              />
              {c.name}
            </label>
          ))}
          {!students.length && <Empty text="В группе пока нет учеников" />}
          <div className="crm-form-footer">
            <Button onClick={() => setDialog("")}>Отмена</Button>
            <Button
              primary
              onClick={async () => {
                if (
                  (await mutate({ type: 'lesson.close', id: record.id, attendance }, "Урок проведён"))
                )
                  setDialog("");
              }}
            >
              Провести урок
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
