import type { DashboardWidget } from "../interfaces/dashboard";
/** TODO(API): Read analytical aggregates by period, branch and employee. Authorize scope on backend. */
export declare function getAnalytics(query: {
  from: string;
  to: string;
  branchId?: string;
}): Promise<Record<string, number>>;
/** TODO(API): Read and persist the authenticated user's widget selection and order. */
export declare function getWidgets(): Promise<DashboardWidget[]>;
export declare function saveWidgets(ids: string[]): Promise<void>;
