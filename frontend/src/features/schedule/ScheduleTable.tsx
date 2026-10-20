import { errorMessage } from "@/shared/api/client";
import type { PhantomLesson } from "@/shared/types/scheduleInterfaces";
import { Alert, EmptyState } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { useEffect, useState } from "react";
import { getSchedule } from "./api";
import { LessonModalWindow } from "./components/LessonModalWindow";
import { buildLessons, lessonState, localDate, weekDaysFor } from "./model";
export function ScheduleTable() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<PhantomLesson[]>([]);
  const [selected, setSelected] = useState<PhantomLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const days = weekDaysFor(currentDate);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setLessons([]);
    const week = weekDaysFor(currentDate);
    getSchedule(localDate(week[0]), localDate(week[6]), controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setLessons(
            buildLessons(week, result.data.templates, result.data.realLessons),
          );
      })
      .catch((ex) => {
        if (!controller.signal.aborted) setError(errorMessage(ex));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [currentDate, revision]);
  const changeWeek = (direction: number) =>
    setCurrentDate(
      (date) =>
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + direction * 7,
        ),
    );
  const hours = lessons.map((l) => Number(l.start_time.split(":")[0]));
  const firstHour = Math.min(8, ...hours),
    lastHour = Math.max(20, ...hours);
  return (
    <section className="ui-page">
      <header className="ui-page-heading">
        <div>
          <h1>Расписание занятий</h1>
          <p>
            {days[0].toLocaleDateString("ru-RU")} —{" "}
            {days[6].toLocaleDateString("ru-RU")}
          </p>
        </div>
        <div className="ui-actions">
          <Button variant="secondary" onClick={() => changeWeek(-1)}>
            ← Назад
          </Button>
          <Button onClick={() => setCurrentDate(new Date())}>Сегодня</Button>
          <Button variant="secondary" onClick={() => changeWeek(1)}>
            Вперёд →
          </Button>
        </div>
      </header>
      <div className="schedule-legend">
        <span>Запланирован</span>
        <span>Требует закрытия</span>
        <span>Проведён</span>
      </div>
      {error ? (
        <Alert onRetry={() => setRevision((v) => v + 1)}>{error}</Alert>
      ) : loading ? (
        <EmptyState>Загрузка расписания…</EmptyState>
      ) : (
        <>
          {lessons.length === 0 && (
            <EmptyState>На этой неделе занятий нет</EmptyState>
          )}
          <div
            className="ui-table-scroll"
            tabIndex={0}
            aria-label="Недельное расписание, прокручивается горизонтально"
          >
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Время</th>
                  {days.map((day) => (
                    <th key={localDate(day)}>
                      {day.toLocaleDateString("ru-RU", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: lastHour - firstHour + 1 },
                  (_, i) => i + firstHour,
                ).map((hour) => (
                  <tr key={hour}>
                    <th>{String(hour).padStart(2, "0")}:00</th>
                    {days.map((day) => (
                      <td key={localDate(day)}>
                        {lessons
                          .filter(
                            (l) =>
                              localDate(l.lesson_date) === localDate(day) &&
                              Number(l.start_time.split(":")[0]) === hour,
                          )
                          .map((l) => (
                            <button
                              key={l.id}
                              className={`schedule-lesson schedule-lesson--${lessonState(l)}`}
                              onClick={() => setSelected(l)}
                            >
                              <strong>{l.group_name}</strong>
                              <span>
                                {l.start_time}–{l.end_time}
                              </span>
                              <small>{l.user_name}</small>
                            </button>
                          ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {selected && (
        <LessonModalWindow
          lessonId={selected.id}
          groupId={selected.group_id}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
