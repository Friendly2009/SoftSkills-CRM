export type Entity =
  | "clients"
  | "leads"
  | "groups"
  | "teachers"
  | "tasks"
  | "subscriptions"
  | "companies"
  | "users"
  | "lessons"
  | "transactions";
export type Value = string | number | boolean | string[];
export interface CrmRecord {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  [key: string]: Value;
}
export interface Activity {
  id: string;
  entity: Entity;
  recordId: string;
  text: string;
  date: string;
}
export interface DictionaryItem {
  id: string;
  name: string;
  color: string;
  description: string;
  createdDay?: string;
}
export interface MockDatabase {
  version: 1;
  records: Record<Entity, CrmRecord[]>;
  activity: Activity[];
  settings: Record<string, Record<string, Value>>;
  dictionaries: Record<string, DictionaryItem[]>;
  widgets: string[];
  notifications: { id: string; text: string; read: boolean }[];
  profile: { name: string; email: string; phone: string };
  aiBalance: number;
}
export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "time"
    | "select"
    | "textarea"
    | "checkbox"
    | "password";
  required?: boolean;
  options?: string[];
  relation?: Entity;
  dictionary?: string;
  min?: number;
  step?: string;
}
export interface ModuleDefinition {
  title: string;
  singular: string;
  fields: Field[];
  columns: string[];
  statuses: string[];
}
export interface ListQuery {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}
export interface PageResult<T> {
  items: T[];
  total: number;
}
export type RecordDraft = Record<string, Value>;
