import type { Entity, RecordDraft, DictionaryItem, MockDatabase } from '../interfaces/common';

/** Serializable intentions. The API must execute them atomically on the server. */
export type CrmCommand =
  | { type: 'record.save'; entity: Entity; draft: RecordDraft; id?: string }
  | { type: 'records.import'; entity: Entity; rows: RecordDraft[] }
  | { type: 'records.status'; entity: Entity; ids: string[]; status: string }
  | { type: 'lead.move'; id: string; status: string }
  | { type: 'client.topUp'; id: string; amount: number; key: string }
  | { type: 'lesson.close'; id: string; attendance: string[] }
  | { type: 'activity.add'; entity: Entity; id: string; text: string }
  | { type: 'settings.save'; name: string; values: RecordDraft }
  | { type: 'dictionary.save'; name: string; item: DictionaryItem }
  | { type: 'dictionary.remove'; name: string; id: string }
  | { type: 'profile.save'; profile: MockDatabase['profile'] }
  | { type: 'widget.add' | 'widget.remove'; id: string }
  | { type: 'notifications.read' }
  | { type: 'ai.topUp'; amount: number }
  | { type: 'ai.report'; title: string }
  | { type: 'license.extend'; months: number };

export interface Snapshot { data: MockDatabase; revision: string }
export interface CrmDataSource {
  load(signal: AbortSignal): Promise<Snapshot>;
  execute(command: CrmCommand, revision: string, requestId: string, signal: AbortSignal): Promise<Snapshot>;
  logout(signal: AbortSignal): Promise<void>;
}
