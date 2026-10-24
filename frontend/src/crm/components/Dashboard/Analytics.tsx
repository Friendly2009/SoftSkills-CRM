import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useCrm } from "../../mocks/store/CrmProvider";
import { money, dateKey, shiftDate } from "../../utils/format";
import { Button, Modal } from "../ui";
const widgets: Record<string, string> = {
  lessons: "Проведённые уроки",
  sales: "Воронка продаж",
  finance: "Движение денежных средств",
  attendance: "Клиенты и посещаемость",
};
export function Analytics() {
  const { db, mutate } = useCrm();
  const [add, setAdd] = useState(false),
    [period, setPeriod] = useState("30");
  const from = shiftDate(dateKey(new Date()), -Number(period));
  const transactions = db.records.transactions.filter(
      (t) => String(t.date) >= from,
    ),
    lessons = db.records.lessons.filter((l) => String(l.date) >= from);
  const income = transactions
      .filter((t) => t.status === "Приход")
      .reduce((s, t) => s + Number(t.amount), 0),
    expense = transactions
      .filter((t) => t.status === "Расход")
      .reduce((s, t) => s + Number(t.amount), 0);
  const chartData: Record<string, { name: string; value: number }[]> = {
    lessons: [
      {
        name: "План",
        value: lessons.filter((l) => l.status === "Запланирован").length,
      },
      {
        name: "Проведены",
        value: lessons.filter((l) => l.status === "Проведён").length,
      },
      {
        name: "Отменены",
        value: lessons.filter((l) => l.status === "Отменён").length,
      },
    ],
    sales: [
      "Не разобран",
      "Назначен контакт",
      "Назначена проба",
      "Получена оплата",
    ].map((s) => ({
      name: s,
      value: db.records.leads.filter(
        (l) => l.status === s && l.createdAt.slice(0, 10) >= from,
      ).length,
    })),
    finance: [
      { name: "Приход", value: income },
      { name: "Расход", value: expense },
    ],
    attendance: [
      {
        name: "Активные",
        value: db.records.clients.filter((c) => c.status === "Активен").length,
      },
      {
        name: "Пробные",
        value: db.records.clients.filter((c) => c.status === "Пробный").length,
      },
      {
        name: "Посещения",
        value: lessons.reduce(
          (s, l) => s + (Array.isArray(l.attendance) ? l.attendance.length : 0),
          0,
        ),
      },
    ],
  };
  return (
    <>
      <div className="crm-page-heading">
        <h1>Аналитика</h1>
      </div>
      <div className="crm-toolbar">
        <select
          aria-label="Период аналитики"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7">Последние 7 дней</option>
          <option value="30">Последние 30 дней</option>
          <option value="90">Последние 90 дней</option>
        </select>
        <div className="flex-1" />
        <Button primary onClick={() => setAdd(true)}>
          <Plus size={15} />
          Добавить виджет
        </Button>
      </div>
      <div className="crm-stats">
        {[
          [
            "Клиенты",
            db.records.clients.filter((c) => c.status !== "Архив").length,
          ],
          ["Заявки", db.records.leads.length],
          ["Доход за период", money(income)],
          ["Разница доходов и расходов", money(income - expense)],
        ].map(([label, value]) => (
          <div className="crm-panel p-5" key={label}>
            <span className="text-slate-500">{label}</span>
            <strong className="block text-2xl font-normal mt-2">{value}</strong>
          </div>
        ))}
      </div>
      <div className="crm-widgets">
        {db.widgets
          .filter((id) => widgets[id])
          .map((id) => (
            <section className="crm-panel" key={id}>
              <header className="crm-widget-title">
                <h2>{widgets[id]}</h2>
                <Button
                  aria-label={`Убрать ${widgets[id]}`}
                  onClick={async () =>
                    (await mutate({ type: 'widget.remove', id }))
                  }
                >
                  <X size={14} />
                </Button>
              </header>
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData[id]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={45} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Количество / сумма"
                      fill="#41b7c5"
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ))}
      </div>
      {add && (
        <Modal title="Добавить виджет" onClose={() => setAdd(false)}>
          <div className="space-y-3">
            {Object.entries(widgets).map(([id, label]) => (
              <Button
                key={id}
                className="w-full"
                disabled={db.widgets.includes(id)}
                onClick={async () => {
                  if (await mutate({ type: 'widget.add', id })) setAdd(false);
                }}
              >
                <Plus size={14} />
                {label}
                {db.widgets.includes(id) && " — добавлен"}
              </Button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
