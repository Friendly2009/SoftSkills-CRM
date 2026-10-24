import type { CrmRecord } from "./common";
export interface Employee extends CrmRecord {
  email: string;
  phone: string;
  role: string;
}
