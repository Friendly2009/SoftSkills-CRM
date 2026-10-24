import { useNavigate } from "react-router-dom";
import { useCrm } from "../../../mocks/store/CrmProvider";
import type { CrmRecord } from "../../../interfaces/common";
export const minute = (value: string) =>
  Number(value.split(":")[0]) * 60 + Number(value.split(":")[1]);
/** Allocate simultaneous events to separate columns, reusing a column after its last event ends. */
export function arrangeLessons(lessons: CrmRecord[]) {
  const ends: number[] = [];
  const rows = [...lessons]
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
    .map((lesson) => {
      let lane = ends.findIndex((end) => end <= minute(String(lesson.start)));
      if (lane < 0) lane = ends.length;
      ends[lane] = minute(String(lesson.end));
      return { lesson, lane };
    });
  return { rows, columns: Math.max(1, ends.length) };
}
export function DayColumn({
  day,
  lessons,
  startHour,
  endHour,
  onAdd,
}: {
  day: string;
  lessons: CrmRecord[];
  startHour: number;
  endHour: number;
  onAdd: (day: string, time: string) => void;
}) {
  const nav = useNavigate();
  const { db } = useCrm();
  const { rows, columns } = arrangeLessons(lessons);
  return (
    <div className="crm-day">
      {Array.from({ length: endHour - startHour }, (_, i) => (
        <button
          aria-label={`Добавить урок ${day} ${i + startHour}:00`}
          className="crm-hour-cell"
          key={i}
          onClick={() =>
            onAdd(day, `${String(i + startHour).padStart(2, "0")}:00`)
          }
        />
      ))}
      {rows.map(({ lesson: l, lane }) => (
        <button
          title={`${l.name} · ${l.start}–${l.end}`}
          className={`crm-calendar-lesson ${l.status === "Проведён" ? "done" : ""} ${l.status === "Отменён" ? "cancelled" : ""}`}
          style={{
            top: (minute(String(l.start)) - startHour * 60) * 0.95,
            height: Math.max(
              20,
              (minute(String(l.end)) - minute(String(l.start))) * 0.95 - 3,
            ),
            left: `calc(${(lane * 100) / columns}% + 3px)`,
            width: `calc(${100 / columns}% - 6px)`,
            right: "auto",
          }}
          key={l.id}
          onClick={() => nav(`/dashboard/lessons/${l.id}`)}
        >
          <strong>
            {String(l.start)}–{String(l.end)}
          </strong>
          <span>{l.name}</span>
          <small>
            {db.records.teachers.find((t) => t.id === l.teacherId)?.name}
          </small>
          <small>{String(l.room || "")}</small>
        </button>
      ))}
    </div>
  );
}
