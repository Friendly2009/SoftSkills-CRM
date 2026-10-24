import type { CrmRecord } from "./common";
export interface Group extends CrmRecord {
  teacherId: string;
  subject: string;
  capacity: number;
  startDate: string;
  endDate: string;
}
