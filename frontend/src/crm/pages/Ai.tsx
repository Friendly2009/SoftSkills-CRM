import { useState } from "react";
import {
  Banknote,
  Star,
  Mic,
  ChartColumn,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useCrm } from "../mocks/store/CrmProvider";
import { money } from "../utils/format";
import { Button, Modal, Empty } from "../components/ui";
export function Ai() {
  const { db, mutate, isMock } = useCrm();
  const [tab, setTab] = useState("Сводка"),
    [dialog, setDialog] = useState(""),
    [amount, setAmount] = useState("1000"),
    [report, setReport] = useState(""),
    [period, setPeriod] = useState("7");
  const chart = Array.from({ length: Number(period) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Number(period) + 1 + i);
    return {
      date: date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      }),
      calls: isMock ? 0 : null,
      reports: (db.dictionaries.aiReports || []).filter(
        (r) => r.createdDay === date.toISOString().slice(0, 10),
      ).length,
    };
  });
  return (
    <>
      <div className="crm-page-heading">
        <h1>Искусственный интеллект</h1>
        <div className="flex-1" />
        <span>
          Баланс: <b>{money(db.aiBalance)}</b>
        </span>
        <Button onClick={() => setDialog("balance")}>
          <Plus size={15} />
          Пополнить
        </Button>
      </div>
      <div className="crm-tabs">
        {["Сводка", "Отчёты", "Использование"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Сводка" ? (
        <>
          <div className="flex justify-end mb-5">
            <select
              aria-label="Период ИИ"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7">Неделя</option>
              <option value="30">Месяц</option>
            </select>
          </div>
          <div className="crm-ai-stats">
            {[
              {
                icon: Banknote,
                label: "Баланс AI счёта",
                value: money(db.aiBalance),
                color: "#555f66",
              },
              {
                icon: Star,
                label: "Средняя эффективность менеджеров на звонках",
                value: isMock ? "0 / 100" : "—",
                color: "#f0a819",
              },
              {
                icon: Mic,
                label: "Транскрипций звонков",
                value: isMock ? "0" : "—",
                color: "#3098bd",
              },
              {
                icon: ChartColumn,
                label: "Создано AI отчётов",
                value: String(db.dictionaries.aiReports?.length || 0),
                color: "#43b9c2",
              },
              {
                icon: Clock,
                label: "Средняя длительность звонка",
                value: isMock ? "00:00:00" : "—",
                color: "#7a8085",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label}>
                <Icon size={24} style={{ color }} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section className="crm-panel p-5">
            <h2 className="text-lg text-center mb-6">
              Использование AI по дням
            </h2>
            <div style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid vertical={false} stroke="#edf0f2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={30} />
                  <Tooltip />
                  <Legend />
                  <Line
                    name="Транскрипция звонков"
                    dataKey="calls"
                    stroke="#75b0da"
                    dot={false}
                  />
                  <Line
                    name="Отчёты и ассистенты"
                    dataKey="reports"
                    stroke="#80c585"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : tab === "Отчёты" ? (
        <>
          <div className="crm-widgets">
            {[
              ["Ежедневная сводка", "Уроки, новые заявки и актуальные задачи."],
              ["Анализ клиентской базы", "Активные ученики и задолженность."],
              ["Анализ продаж", "Заявки и распределение по этапам воронки."],
              ["Финансовая сводка", "Поступления и расходы учебного центра."],
            ].map(([title, description]) => (
              <section key={title} className="crm-panel p-6">
                <FileText size={22} className="text-slate-400 mb-3" />
                <h2 className="font-medium mb-2">{title}</h2>
                <p className="text-slate-500 mb-5">{description}</p>
                <Button
                  onClick={async () => {
                    if (isMock) { setReport(title); setDialog("report"); }
                    else await mutate({ type: "ai.report", title }, "Отчёт получен с сервера");
                  }}
                >
                  Сформировать
                </Button>
              </section>
            ))}
          </div>
          <section className="crm-panel p-5">
            {(db.dictionaries.aiReports || []).map((r) => (
              <button
                key={r.id}
                className="crm-search-result"
                onClick={() => {
                  setReport(r.description);
                  setDialog("saved");
                }}
              >
                {r.name}
                <small>Открыть</small>
              </button>
            ))}
            {!db.dictionaries.aiReports?.length && (
              <Empty text="Сохранённых отчётов пока нет" />
            )}
          </section>
        </>
      ) : (
        <section className="crm-panel p-6">
          <h2 className="font-medium mb-3">Использование ИИ</h2>
          <p>Сохранено отчётов: {db.dictionaries.aiReports?.length || 0}</p>
          <p className="crm-hint mt-3">
            {isMock ? "В демо запросы к ИИ не отправляются, средства не списываются." : "Отчёты формируются сервером."}
          </p>
        </section>
      )}
      {dialog === "balance" && (
        <Modal
          title={isMock ? "Пополнить демонстрационный баланс" : "Пополнить баланс"}
          onClose={() => setDialog("")}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const n = Number(amount);
              if (
                n > 0 &&
                Number.isFinite(n) &&
                (await mutate({ type: 'ai.topUp', amount: n }))
              )
                setDialog("");
            }}
          >
            <p className="crm-hint mb-4">
              {isMock ? "Тестовое пополнение, без реального платежа." : "Операция будет отправлена на сервер."}
            </p>
            <input
              aria-label="Сумма пополнения ИИ"
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="crm-form-footer">
              <Button primary type="submit">
                Пополнить
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {(dialog === "report" || dialog === "saved") && (
        <Modal
          title={dialog === "report" ? report : "Сохранённый отчёт"}
          onClose={() => setDialog("")}
        >
          <div className="space-y-3 whitespace-pre-line">
            {dialog === "saved" ? (
              report
            ) : (
              <>
                <p>
                  Клиентов: {db.records.clients.length}, из них с
                  задолженностью:{" "}
                  {
                    db.records.clients.filter((c) => Number(c.balance) < 0)
                      .length
                  }
                  .
                </p>
                <p>
                  Заявок в работе:{" "}
                  {
                    db.records.leads.filter(
                      (l) => !["Получена оплата", "Отказ"].includes(l.status),
                    ).length
                  }
                  .
                </p>
                <p>
                  Запланировано уроков:{" "}
                  {
                    db.records.lessons.filter(
                      (l) => l.status === "Запланирован",
                    ).length
                  }
                  .
                </p>
                <p>
                  Открыто задач:{" "}
                  {
                    db.records.tasks.filter((t) => t.status !== "Выполнена")
                      .length
                  }
                  .
                </p>
              </>
            )}
          </div>
          {dialog === "report" && (
            <div className="crm-form-footer">
              <Button
                primary
                onClick={async () => {
                  if (await mutate({ type: 'ai.report', title: report }, "Отчёт сохранён")) setDialog("");
                }}
              >
                Сохранить отчёт
              </Button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
