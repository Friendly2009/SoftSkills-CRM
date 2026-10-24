import type { CrmCommand, CrmDataSource, Snapshot } from './commands';
import { isCrmState } from './validation';
import { createSeed } from '../mocks/data/seed';
import { saveRecord, moveLead, topUp, closeLesson, addActivity } from '../mocks/services/operations';
import { modules } from '../config/modules';
import { dateKey, shiftDate, money } from '../utils/format';
import type { MockDatabase } from '../interfaces/common';
export const MOCK_KEY = 'softskills.crm.demo.v1';
export function loadMockState(): MockDatabase {
  try {
    const state: unknown = JSON.parse(localStorage.getItem(MOCK_KEY) || 'null');
    if (isCrmState(state)) return state;
  } catch { /* Only mock mode may recover from invalid demo storage. */ }
  return createSeed();
}
export function applyCommand(d: MockDatabase, c: CrmCommand) {
  switch (c.type) {
    case 'record.save': {
      const r = saveRecord(d, c.entity, c.draft, c.id);
      if (c.entity === 'leads' && r.status === 'Получена оплата') moveLead(d, r.id, r.status);
      break;
    }
    case 'records.import':
      for (const original of c.rows) {
        const draft = { ...original };
        for (const f of modules[c.entity].fields.filter(f => f.relation)) {
          const found = d.records[f.relation!].find(r => r.name === draft[f.key] || r.id === draft[f.key]);
          if (draft[f.key] && !found) throw new Error(`Не найдена связанная запись: ${draft[f.key]}`);
          draft[f.key] = found?.id || '';
        }
        applyCommand(d, { type: 'record.save', entity: c.entity, draft });
      }
      break;
    case 'records.status':
      for (const id of c.ids) {
        const r = d.records[c.entity].find(r => r.id === id);
        if (!r) throw new Error('Запись не найдена');
        if (c.entity === 'leads') moveLead(d, id, c.status);
        else saveRecord(d, c.entity, { ...r, status: c.status }, id);
      }
      break;
    case 'lead.move': moveLead(d, c.id, c.status); break;
    case 'client.topUp': topUp(d, c.id, c.amount, c.key); break;
    case 'lesson.close': closeLesson(d, c.id, c.attendance); break;
    case 'activity.add': addActivity(d, c.entity, c.id, c.text); break;
    case 'settings.save': d.settings[c.name] = c.values; break;
    case 'dictionary.save': {
      const list = d.dictionaries[c.name] || [];
      d.dictionaries[c.name] = list.some(i => i.id === c.item.id) ? list.map(i => i.id === c.item.id ? c.item : i) : [...list, c.item];
      break;
    }
    case 'dictionary.remove': d.dictionaries[c.name] = (d.dictionaries[c.name] || []).filter(i => i.id !== c.id); break;
    case 'profile.save': d.profile = c.profile; break;
    case 'widget.add': if (!d.widgets.includes(c.id)) d.widgets.push(c.id); break;
    case 'widget.remove': d.widgets = d.widgets.filter(w => w !== c.id); break;
    case 'notifications.read': d.notifications.forEach(n => { n.read = true; }); break;
    case 'ai.topUp':
      if (!Number.isFinite(c.amount) || c.amount <= 0) throw new Error('Некорректная сумма');
      d.aiBalance += c.amount; break;
    case 'ai.report': d.dictionaries.aiReports = [{
      id: crypto.randomUUID(), name: c.title + ' · ' + new Date().toLocaleDateString('ru-RU'),
      createdDay: dateKey(new Date()), color: '#35b3c3',
      description: `Клиенты: ${d.records.clients.length}\nЗаявки: ${d.records.leads.length}\nУроки: ${d.records.lessons.length}\nЗадачи: ${d.records.tasks.length}`,
    }, ...(d.dictionaries.aiReports || [])]; break;
    case 'license.extend': {
      if (![1,3,6,12].includes(c.months)) throw new Error('Некорректный период');
      const today = dateKey(new Date());
      const previous = String(d.settings.license?.until || today);
      const until = shiftDate(previous > today ? previous : today, c.months * 30);
      d.settings.license = { plan: 'Демонстрационный', until };
      d.dictionaries.licenseHistory = [{ id: crypto.randomUUID(), name: `Продление на ${c.months} мес.`, description: `${new Date().toLocaleDateString('ru-RU')} · до ${until} · ${money(c.months * 1500)}`, color: '#35b3c3' }, ...(d.dictionaries.licenseHistory || [])];
      break;
    }
  }
}
export function createMockSource(initial = loadMockState()): CrmDataSource {
  let current: Snapshot = { data: initial, revision: '0' };
  return {
    load: async () => current,
    execute: async command => {
      const next = structuredClone(current.data);
      applyCommand(next, command);
      localStorage.setItem(MOCK_KEY, JSON.stringify(next));
      current = { data: next, revision: String(Number(current.revision) + 1) };
      return current;
    },
    logout: async () => {},
  };
}
