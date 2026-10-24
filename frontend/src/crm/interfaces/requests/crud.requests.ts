import type { CrmRecord, ListQuery, PageResult, RecordDraft } from "../common";
/** Future HTTP adapter. Mock services obey this data boundary without issuing requests. */
export interface CrudRequests<T extends CrmRecord> {
  /** List records with server filtering and pagination. */
  list(query?: ListQuery): Promise<PageResult<T>>;
  /** Fetch one record and return 404 if inaccessible. */
  get(id: string): Promise<T>;
  /** Validate and persist a record, returning its assigned ID. */
  create(input: RecordDraft): Promise<T>;
  /** Persist changed fields and return the updated record. */
  update(id: string, input: RecordDraft): Promise<T>;
  /** Archive a record while preserving historical financial references. */
  archive(id: string): Promise<void>;
}
