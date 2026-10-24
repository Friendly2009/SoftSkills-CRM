import type { CrmRecord } from "./common";
export interface Lead extends CrmRecord {
  phone: string;
  email: string;
  source: string;
  teacherId: string;
  comment: string;
}
