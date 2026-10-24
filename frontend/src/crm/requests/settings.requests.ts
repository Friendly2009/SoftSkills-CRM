import type { Value, DictionaryItem } from "../interfaces/common";
/** TODO(API): Retrieve tenant settings and editable dictionaries. */
export declare function getSettings(): Promise<
  Record<string, Record<string, Value>>
>;
/** TODO(API): Validate and save a section; keep integration credentials on the server. */
export declare function saveSettings(
  section: string,
  input: Record<string, Value>,
): Promise<void>;
/** TODO(API): Retrieve dictionary entries for the requested tenant section. */
export declare function getDictionary(
  section: string,
): Promise<DictionaryItem[]>;

/** TODO(API): Create/update an authorized dictionary entry and validate references before deletion. */
export declare function saveDictionaryItem(
  section: string,
  item: DictionaryItem,
): Promise<DictionaryItem>;
export declare function deleteDictionaryItem(
  section: string,
  id: string,
): Promise<void>;
