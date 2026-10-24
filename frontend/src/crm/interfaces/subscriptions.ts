import type { CrmRecord } from "./common";
export interface Subscription extends CrmRecord {
  price: number;
  lessons: number;
  days: number;
  subject: string;
}
