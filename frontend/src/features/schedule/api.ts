import { request } from "@/shared/api/client";
import { localDate, type RealLesson, type ScheduleTemplate } from "./model";
export const formatDateToISOString = localDate;
export function formatDateToString(input: string | Date | null | undefined) {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? "" : localDate(date);
}
export const getSchedule = (
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
) =>
  request<{
    success: true;
    data: { templates: ScheduleTemplate[]; realLessons: RealLesson[] };
  }>(`/schedule?${new URLSearchParams({ startDate, endDate })}`, { signal });
export const getLessonModal = (id: string) =>
  request<{
    success: boolean;
    data: import("@/shared/types/scheduleInterfaces").LessonModalData & {
      isReadOnly: boolean;
    };
  }>(`/getlessons/${encodeURIComponent(id)}`);
