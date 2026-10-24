import type { CrmRecord } from "./common";
export interface Client extends CrmRecord {
  phone: string;
  email: string;
  balance: number;
  groupId: string;
  source: string;
  birthday: string;
}
