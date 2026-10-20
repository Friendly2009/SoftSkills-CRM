export type ImportType = 'clients' | 'leads' | 'employees';
export type ImportRow = Record<string, string | number>;
export function validateImport(type: unknown, input: unknown, rank: number): { type: ImportType; rows: ImportRow[] } {
  if (!['clients', 'leads', 'employees'].includes(String(type))) throw new Error('Неизвестная категория импорта');
  if (rank < (type === 'employees' ? 1000 : 500)) throw new Error('Недостаточно прав');
  if (!Array.isArray(input) || input.length < 1 || input.length > 200) throw new Error('Допустимо от 1 до 200 строк');
  const fields = type === 'employees' ? ['full_name', 'email', 'password', 'contact'] : type === 'clients' ? ['name', 'contact'] : ['name', 'contact', 'source', 'description'];
  const rows = input.map((raw, index) => {
    const fail = (message: string): never => { throw new Error(`Строка ${index + 2}: ${message}`); };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('ожидался объект');
    if (Object.keys(raw).some(key => !fields.includes(key))) return fail('неподдерживаемый столбец');
    const row: ImportRow = {};
    for (const key of fields) {
      if (raw[key] != null && !['string','number'].includes(typeof raw[key])) return fail(`неверное значение ${key}`);
      const text = String(raw[key] ?? '').trim();
      const limit = key === 'contact' ? 45 : key === 'source' ? 100 : key === 'description' ? 2000 : 255;
      if (text.length > limit) return fail(`слишком длинное поле ${key}`);
      row[key] = text;
    }
    if (!row[type === 'employees' ? 'full_name' : 'name']) return fail('укажите имя');
    if (type === 'leads' && !row.contact) return fail('укажите контакт');
    if (type === 'employees') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))) return fail('некорректная почта');
      if (String(row.password).length < 8 || new TextEncoder().encode(String(row.password)).length > 72) return fail('пароль: от 8 символов до 72 байт');
    }
    return row;
  });
  if (type === 'employees' && new Set(rows.map(row => String(row.email).toLowerCase())).size !== rows.length) throw new Error('Почта сотрудников не должна повторяться');
  return { type: type as ImportType, rows };
}
