import { describe, expect, it } from 'vitest';
import { validateImport } from '../services/importRows.js';
describe('import validation', () => {
  it('accepts a client without financial fields', () => expect(validateImport('clients', [{ name: 'Иван', contact: '+7000' }], 500).rows).toHaveLength(1));
  it('rejects attempts to import a balance or company ID', () => expect(() => validateImport('clients', [{ name: 'Иван', balance: 500, company_id: 2 }], 500)).toThrow());
  it('requires administrator permissions for employees', () => expect(() => validateImport('employees', [{}], 500)).toThrow('Недостаточно прав'));
  it('identifies invalid row numbers', () => expect(() => validateImport('leads', [{ name: 'Иван' }], 500)).toThrow('Строка 2'));
  it('rejects duplicate employee email addresses', () => expect(() => validateImport('employees', Array(2).fill({ full_name: 'A', email: 'a@test.ru', password: 'password123' }), 1000)).toThrow('повторяться'));
  it('rejects an oversized batch', () => expect(() => validateImport('clients', Array(201).fill({ name: 'A' }), 500)).toThrow('200'));
});
