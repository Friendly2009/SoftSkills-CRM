import type { CrmRecord } from "./common";
export interface Lesson extends CrmRecord {
  groupId: string;
  teacherId: string;
  date: string;
  start: string;
  end: string;
  room: string;
  rate: number;
  pay: number;
  attendance: string[];
}
