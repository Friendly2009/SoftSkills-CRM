import { DayColumn, minute } from "./components/DayColumn";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCrm } from "../../mocks/store/CrmProvider";
import { dateKey, shiftDate } from "../../utils/format";
import { Button } from "../ui";
import { RecordForm } from "../Clients/components/RecordForm";
import { EntityWorkspace } from "../Clients/EntityWorkspace";
export function Schedule() {
  const { db } = useCrm();
  const nav = useNavigate();
  const [date, setDate] = useState(dateKey(new Date())),
    [view, setView] = useState("Неделя"),
    [teacher, setTeacher] = useState(""),
    [create, setCreate] = useState(false),
    [newDate, setNewDate] = useState(date),
    [hour, setHour] = useState("16:00");
  const start = new Date(date + "T12:00:00");
  if (view === "Неделя")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (view === "Месяц") {
    start.setDate(1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  }
  const days = Array.from(
    { length: view === "День" ? 1 : view === "Месяц" ? 42 : 7 },
    (_, i) => shiftDate(dateKey(start), i),
  );
  const lessons = db.records.lessons.filter(
    (l) => !teacher || l.teacherId === teacher,
  );
  const startHour = Math.min(
    8,
    ...lessons.map((l) => Math.floor(minute(String(l.start)) / 60)),
  );
  const endHour = Math.max(
    22,
    ...lessons.map((l) => Math.ceil(minute(String(l.end)) / 60)),
  );
  function add(day: string, time = "16:00") {
    setNewDate(day);
    setHour(time);
    setCreate(true);
  }
  function step(direction: number) {
    if (view === "Месяц") {
      const d = new Date(date + "T12:00:00");
      d.setDate(1);
      d.setMonth(d.getMonth() + direction);
      setDate(dateKey(d));
    } else setDate(shiftDate(date, (view === "День" ? 1 : 7) * direction));
  }
  return (
    <>
      <div className="crm-page-heading">
        <h1>Расписание уроков</h1>
      </div>
      <div className="crm-toolbar">
        <Button primary onClick={() => add(date)}>
          <Plus size={15} />
          Добавить урок
        </Button>
        <Button aria-label="Предыдущий период" onClick={() => step(-1)}>
          <ChevronLeft size={16} />
        </Button>
        <Button onClick={() => setDate(dateKey(new Date()))}>Сегодня</Button>
        <Button aria-label="Следующий период" onClick={() => step(1)}>
          <ChevronRight size={16} />
        </Button>
        <input
          aria-label="Дата расписания"
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
        <div className="flex-1" />
        <select
          aria-label="Педагог"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
        >
          <option value="">Все педагоги</option>
          {db.records.teachers.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="crm-segment">
          {["День", "Неделя", "Месяц", "Список"].map((v) => (
            <button
              className={view === v ? "active" : ""}
              key={v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === "Список" ? (
        <EntityWorkspace entity="lessons" compact />
      ) : view === "Месяц" ? (
        <div className="crm-month">
          {days.map((day) => (
            <div
              key={day}
              className={day === dateKey(new Date()) ? "today" : ""}
            >
              <button className="crm-day-number" onClick={() => add(day)}>
                {new Date(day + "T12:00").toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
                <Plus size={12} />
              </button>
              {lessons
                .filter((l) => l.date === day)
                .map((l) => (
                  <button
                    className="crm-month-lesson"
                    key={l.id}
                    onClick={() => nav(`/dashboard/lessons/${l.id}`)}
                  >
                    {String(l.start)} {l.name}
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="crm-calendar-scroll">
          <div
            className="crm-calendar"
            style={{
              gridTemplateColumns: `52px repeat(${days.length}, minmax(130px,1fr))`,
            }}
          >
            <div className="crm-calendar-header" />
            {days.map((day) => (
              <div
                key={day}
                className={`crm-calendar-header ${day === dateKey(new Date()) ? "today" : ""}`}
              >
                {new Date(day + "T12:00").toLocaleDateString("ru-RU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </div>
            ))}
            <div className="crm-hours">
              {Array.from({ length: endHour - startHour }, (_, i) => (
                <div key={i}>{i + startHour}:00</div>
              ))}
            </div>
            {days.map((day) => (
              <DayColumn
                key={day}
                day={day}
                lessons={lessons.filter((l) => l.date === day)}
                startHour={startHour}
                endHour={endHour}
                onAdd={add}
              />
            ))}
          </div>
        </div>
      )}
      {create && (
        <RecordForm
          entity="lessons"
          defaults={{
            date: newDate,
            start: hour,
            end:
              Number(hour.slice(0, 2)) >= 23
                ? "23:59"
                : `${String(Number(hour.slice(0, 2)) + 1).padStart(2, "0")}:00`,
            rate: 800,
            pay: 1500,
          }}
          onClose={() => setCreate(false)}
        />
      )}
    </>
  );
}
