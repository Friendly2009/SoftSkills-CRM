import type { CrudRequests } from "../interfaces/requests/crud.requests";
import type { CrmRecord } from "../interfaces/common";
/** TODO(API): Implement authenticated users operations using the agreed backend contract.
 * Handle validation, permissions, errors and pagination here. No URL is assumed yet.
 * This declaration is type-only; never import it as a runtime value into the mock UI.
 */
export declare const usersRequests: CrudRequests<CrmRecord>;
