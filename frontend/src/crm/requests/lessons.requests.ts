import type { CrudRequests } from "../interfaces/requests/crud.requests";
import type { CrmRecord } from "../interfaces/common";
/** TODO(API): Implement authenticated lessons operations using the agreed backend contract.
 * Handle validation, permissions, errors and pagination here. No URL is assumed yet.
 * This declaration is type-only; never import it as a runtime value into the mock UI.
 */
export declare const lessonsRequests: CrudRequests<CrmRecord>;

/** TODO(API): Fetch lessons by period, teacher, room and branch with server-side permission scoping. */
export declare function getSchedule(
  from: string,
  to: string,
  teacherId?: string,
): Promise<CrmRecord[]>;
