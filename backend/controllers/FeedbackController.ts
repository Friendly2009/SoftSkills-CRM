import { Response } from 'express';
import pool from "../data_base_connect.js";
import { RowDataPacket, ResultSetHeader } from 'mysql2';

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    company_id: number;
    role: string;
  };
}

export const create_feedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, rate } = req.body;
    const userId = req.user?.id; 

    if (!userId) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    if (!message || !rate || rate < 1 || rate > 5) {
      res.status(400).json({ error: 'Неверные данные: сообщение или оценка от 1 до 5' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO feedbacks (message, user_id, rate) VALUES (?, ?, ?)',
      [message, userId, rate]
    );

    res.status(211).json({ 
      message: 'Отзыв успешно добавлен', 
      feedbackId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при создании отзыва' });
  }
};

export const get_all_feedbacks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT f.id, f.message, f.rate, f.created_at, f.user_id,
              u.full_name, u.role, u.avatar, c.name as company_name
       FROM feedbacks f
       INNER JOIN users u ON f.user_id = u.id
       INNER JOIN company c ON u.company_id = c.id
       ORDER BY f.created_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при получении отзывов' });
  }
};

export const get_my_feedbacks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, message, rate, created_at FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при получении личных отзывов' });
  }
};

export const update_feedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, rate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM feedbacks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: 'Отзыв не найден' });
      return;
    }

    if (existing[0].user_id !== userId) {
      res.status(403).json({ error: 'У вас нет прав на редактирование этого отзыва' });
      return;
    }

    await pool.execute(
      'UPDATE feedbacks SET message = ?, rate = ? WHERE id = ?',
      [message, rate, id]
    );

    res.status(200).json({ message: 'Отзыв успешно обновлен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении отзыва' });
  }
};

export const delete_feedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM feedbacks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: 'Отзыв не найден' });
      return;
    }

    if (existing[0].user_id !== userId && userRole !== 'admin') {
      res.status(403).json({ error: 'Запрещено к удалению' });
      return;
    }

    await pool.execute('DELETE FROM feedbacks WHERE id = ?', [id]);

    res.status(200).json({ message: 'Отзыв успешно удален' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при удалении отзыва' });
  }
};
