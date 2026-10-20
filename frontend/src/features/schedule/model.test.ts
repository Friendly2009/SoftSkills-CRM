import { describe, expect, it } from "vitest";
import {
  buildLessons,
  lessonState,
  localDate,
  weekDaysFor,
  type ScheduleTemplate,
} from "./model";
const templates: ScheduleTemplate[] = [
  {
    schedule_id: 1,
    group_id: 10,
    day_of_week: "Понедельник",
    start_time: "07:30:00",
    end_time: "08:30:00",
    group_name: "A",
    user_name: "Teacher",
  },
  {
    schedule_id: 2,
    group_id: 20,
    day_of_week: "Понедельник",
    start_time: "12:00:00",
    end_time: "13:00:00",
    group_name: "B",
    user_name: "Teacher",
  },
  {
    schedule_id: 3,
    group_id: 10,
    day_of_week: "Понедельник",
    start_time: "18:00:00",
    end_time: "19:00:00",
    group_name: "A",
    user_name: "Teacher",
  },
];
describe("schedule occurrences", () => {
  const days = weekDaysFor(new Date(2026, 9, 19));
  it("keeps all groups and multiple slots in a day", () => {
    expect(buildLessons(days, templates, [])).toHaveLength(3);
  });
  it("replaces only the matching occurrence with a real lesson", () => {
    const result = buildLessons(days, templates, [
      {
        id: 90,
        group_id: 10,
        lesson_date: "2026-10-19",
        start_time: "07:30:00",
        end_time: "08:30:00",
        group_name: "A",
        status: 2,
      },
    ]);
    expect(result.map((l) => l.id)).toEqual([
      "90",
      "temp-2-2026-10-19",
      "temp-3-2026-10-19",
    ]);
  });
  it("does not mark tonight as overdue this morning", () => {
    const lesson = buildLessons(days, templates, [])[2];
    expect(lessonState(lesson, new Date(2026, 9, 19, 10))).toBe("planned");
    expect(lessonState(lesson, new Date(2026, 9, 19, 20))).toBe("past");
  });
  it("uses local calendar dates across month and year boundaries", () => {
    const week = weekDaysFor(new Date(2027, 0, 3));
    expect(localDate(week[0])).toBe("2026-12-28");
    expect(localDate(week[6])).toBe("2027-01-03");
  });
});
