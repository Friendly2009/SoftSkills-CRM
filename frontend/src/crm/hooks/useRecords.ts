import type { Entity } from "../interfaces/common";
import { useCrm } from "../mocks/store/CrmProvider";
/** MOCK_API: subscribe to local entity data. Replace this hook with a cached list query. */
export function useRecords(entity: Entity) {
  return useCrm().db.records[entity];
}
