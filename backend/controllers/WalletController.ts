import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import pool from '../data_base_connect.js';

/** The row lock serializes concurrent top-ups; the ledger and balance commit together. */
export async function topUpClient(req: Request, res: Response) {
  const companyId = req.session.company_id;
  if (!companyId) return res.status(401).json({ success: false, message: 'Не авторизован' });
  if (Number(req.session.rank || 0) < 500) return res.status(403).json({ success: false, message: 'Недостаточно прав' });
  const id = Number(req.params.id);
  const amount = Number(req.body.amount);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(amount) || amount <= 0 || amount > 9999999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
    return res.status(400).json({ success: false, message: 'Некорректный клиент или сумма пополнения' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [clients] = await connection.query<RowDataPacket[]>('SELECT id, name FROM clients WHERE id = ? AND company_id = ? FOR UPDATE', [id, companyId]);
    if (!clients.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Клиент не найден' }); }
    await connection.execute('UPDATE clients SET balance = balance + ? WHERE id = ? AND company_id = ?', [amount, id, companyId]);
    await connection.execute("INSERT INTO financial_transactions (company_id, lesson_id, client_id, user_id, amount, type, description) VALUES (?, NULL, ?, NULL, ?, 'wallet_topup', ?)", [companyId, id, amount, `Пополнение счета: ${clients[0].name}`]);
    await connection.commit();
    return res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Top-up failed', error);
    return res.status(500).json({ success: false, message: 'Пополнение не выполнено' });
  } finally { connection.release(); }
}
