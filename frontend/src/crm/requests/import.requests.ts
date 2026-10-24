import type { Entity } from "../interfaces/common";
/** TODO(API): Validate an import file without mutating records. Return preview + row errors. */
export declare function previewImport(
  entity: Entity,
  file: File,
): Promise<{
  token: string;
  validRows: number;
  errors: { row: number; message: string }[];
}>;
/** TODO(API): Commit a previously validated import atomically/idempotently. */
export declare function commitImport(
  token: string,
  requestKey: string,
): Promise<{ created: number }>;
/** TODO(API): Export filtered, authorized rows; return a short-lived file URL. */
export declare function exportRecords(
  entity: Entity,
  filters: Record<string, string>,
): Promise<{ url: string }>;
