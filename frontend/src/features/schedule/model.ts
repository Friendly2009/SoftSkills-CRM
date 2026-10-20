import type { PhantomLesson } from "@/shared/types/scheduleInterfaces";
export interface ScheduleTemplate {
  schedule_id: number;
  group_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  group_name: string;
  user_name: string;
}
export interface RealLesson {
  id: number;
  group_id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  group_name: string;
  user_name?: string;
  status: number;
}
export const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function weekDaysFor(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from(
    { length: 7 },
    (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}
const weekdays = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];
export function buildLessons(
  days: Date[],
  templates: ScheduleTemplate[],
  realLessons: RealLesson[],
): PhantomLesson[] {
  return days.flatMap((day) => {
    const date = localDate(day);
    const real = realLessons.filter(
      (lesson) => lesson.lesson_date.split("T")[0] === date,
    );
    const planned = templates.filter(
      (template) =>
        template.day_of_week.toLowerCase().trim() === weekdays[day.getDay()],
    );
    // Match occurrences, not entire days: other groups and later slots must remain visible.
    const result: PhantomLesson[] = real.map((lesson) => ({
      ...lesson,
      id: String(lesson.id),
      schedule_id: 0,
      lesson_date: new Date(day),
      start_time: lesson.start_time.slice(0, 5),
      end_time: lesson.end_time.slice(0, 5),
      user_name: lesson.user_name || "Не назначен",
    }));
    planned.forEach((template) => {
      if (
        real.some(
          (lesson) =>
            Number(lesson.group_id) === Number(template.group_id) &&
            lesson.start_time.slice(0, 5) === template.start_time.slice(0, 5),
        )
      )
        return;
      result.push({
        ...template,
        id: `temp-${template.schedule_id}-${date}`,
        lesson_date: new Date(day),
        start_time: template.start_time.slice(0, 5),
        end_time: template.end_time.slice(0, 5),
        status: 1,
      });
    });
    return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
  });
}
export function lessonState(
  lesson: PhantomLesson,
  now = new Date(),
): "completed" | "past" | "planned" {
  if (Number(lesson.status) === 2) return "completed";
  const end = new Date(lesson.lesson_date);
  const [hour, minute] = lesson.end_time.split(":").map(Number);
  end.setHours(hour, minute, 0, 0);
  return end <= now ? "past" : "planned";
}
