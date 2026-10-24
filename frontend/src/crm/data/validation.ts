import type { MockDatabase } from '../interfaces/common';
import type { Snapshot } from './commands';
const entities = ['clients','leads','groups','teachers','tasks','subscriptions','companies','users','lessons','transactions'];
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const value = (v: unknown) => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (Array.isArray(v) && v.every(x => typeof x === 'string'));
export function isCrmState(v: unknown): v is MockDatabase {
  if (!object(v) || v.version !== 1 || !object(v.records)) return false;
  const records = v.records;
  return entities.every(k => Array.isArray(records[k]) && records[k].every(r => object(r) &&
    ['id','name','status','createdAt'].every(key => typeof r[key] === 'string') && Object.values(r).every(value))) &&
    Array.isArray(v.activity) && v.activity.every(a => object(a) && ['id','recordId','text','date'].every(k => typeof a[k] === 'string') && entities.includes(String(a.entity))) &&
    object(v.settings) && Object.values(v.settings).every(s => object(s) && Object.values(s).every(value)) &&
    object(v.dictionaries) && Object.values(v.dictionaries).every(d => Array.isArray(d) && d.every(i => object(i) && ['id','name','color','description'].every(k => typeof i[k] === 'string'))) &&
    Array.isArray(v.widgets) && v.widgets.every(w => typeof w === 'string') &&
    Array.isArray(v.notifications) && v.notifications.every(n => object(n) && typeof n.id === 'string' && typeof n.text === 'string' && typeof n.read === 'boolean') &&
    object(v.profile) && ['name','email','phone'].every(k => typeof (v.profile as Record<string, unknown>)[k] === 'string') &&
    typeof v.aiBalance === 'number' && Number.isFinite(v.aiBalance);
}
export function parseSnapshot(v: unknown): Snapshot {
  if (!object(v) || !isCrmState(v.data) || typeof v.revision !== 'string' || !v.revision)
    throw new Error('Сервер вернул данные CRM в неподдерживаемом формате.');
  return { data: v.data, revision: v.revision };
}
