import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2';
import pool from '../data_base_connect.js';
import { validateImport } from '../services/importRows.js';
export async function importRows(req: Request, res: Response) {
  const companyId = req.session.company_id, rank = Number(req.session.rank || 0);
  if (!companyId) return res.status(401).json({ success: false, message: 'Не авторизован' });
  if (rank < (req.body.type === 'employees' ? 1000 : 500)) return res.status(403).json({ success: false, message: 'Недостаточно прав' });
  let validated;
  try { validated = validateImport(req.body.type, req.body.rows, rank); }
  catch (error) { return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Некорректные данные' }); }
  // Hash before holding database locks; plain text passwords are never logged or returned.
  const hashes: string[] = [];
  if (validated.type === 'employees') for (const row of validated.rows) hashes.push(await bcrypt.hash(String(row.password), 10));
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Serialize employee imports for a company to make duplicate-email checks reliable.
    await connection.query('SELECT id FROM company WHERE id = ? FOR UPDATE', [companyId]);
    for (let i = 0; i < validated.rows.length; i++) {
      const row = validated.rows[i];
      if (validated.type === 'employees') {
        const [existing] = await connection.query<RowDataPacket[]>('SELECT id FROM users WHERE company_id = ? AND email = ?', [companyId, row.email]);
        if (existing.length) { await connection.rollback(); return res.status(409).json({ success: false, message: `Строка ${i + 2}: сотрудник с такой почтой уже существует. Импорт отменён.` }); }
        await connection.execute('INSERT INTO users (company_id, full_name, role, `rank`, email, password_hash, contact) VALUES (?, ?, ?, ?, ?, ?, ?)', [companyId, row.full_name, 'Преподаватель', 100, row.email, hashes[i], row.contact || null]);
      } else if (validated.type === 'clients') {
        await connection.execute('INSERT INTO clients (company_id, name, contact, balance, skills, status) VALUES (?, ?, ?, 0, 0, 1)', [companyId, row.name, row.contact]);
      } else {
        await connection.execute("INSERT INTO leads (company_id, name, contact, source, description, status) VALUES (?, ?, ?, ?, ?, 'new')", [companyId, row.name, row.contact, row.source || null, row.description || null]);
      }
    }
    await connection.commit();
    return res.json({ success: true, count: validated.rows.length });
  } catch (error) {
    await connection.rollback(); console.error('Import failed', error);
    return res.status(500).json({ success: false, message: 'Импорт отменён: записи не сохранены' });
  } finally { connection.release(); }
}
