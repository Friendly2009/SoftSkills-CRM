import type { CrmRecord } from "./common";
export interface Transaction extends CrmRecord {
  clientId: string;
  amount: number;
  date: string;
  category: string;
  account: string;
}
