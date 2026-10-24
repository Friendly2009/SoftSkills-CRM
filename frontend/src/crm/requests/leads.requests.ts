import type { CrudRequests } from "../interfaces/requests/crud.requests";
import type { CrmRecord } from "../interfaces/common";
/** TODO(API): Implement authenticated leads operations using the agreed backend contract.
 * Handle validation, permissions, errors and pagination here. No URL is assumed yet.
 * This declaration is type-only; never import it as a runtime value into the mock UI.
 */
export declare const leadsRequests: CrudRequests<CrmRecord>;

/** TODO(API): Transition a lead and atomically link/create a client on conversion. Idempotent per lead. */
export declare function moveLead(
  id: string,
  stage: string,
): Promise<{ leadId: string; clientId?: string }>;
