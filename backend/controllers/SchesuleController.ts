import { Request, Response } from 'express';
import pool from '../data_base_connect.js';

export const getLessonMainInfo = async (req: Request, res: Response) => {
  try {
    const lessonId = parseInt(req.params.id as string);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }

    const [rows]: any = await pool.query(
      'SELECT * FROM v_lesson_details WHERE lesson_id = ?',
      [lessonId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    const row = rows[0];

    return res.json({
      lesson: {
        id: row.lesson_id,
        lesson_date: row.lesson_date,
        start_time: row.start_time,
        end_time: row.end_time,
        status: row.lesson_status,
        group_id: row.group_id,
        user_id: row.teacher_id,
        teacher_pay: row.teacher_pay
      },
      group: {
        id: row.group_id,
        name: row.group_name
      },
      teacher: {
        id: row.teacher_id,
        company_id: row.company_id,
        full_name: row.teacher_name,
        role: 'teacher'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLessonStudentsAndAttendance = async (req: Request, res: Response) => {
  try {
    const lessonId = parseInt(req.params.id as string);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }

    const [lessonRows]: any = await pool.query('SELECT group_id FROM lessons WHERE id = ?', [lessonId]);
    if (!lessonRows.length) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    const groupId = lessonRows[0].group_id;

    const [students]: any = await pool.query(
      'SELECT c.id, c.name, c.balance FROM clients c JOIN group_members gm ON c.id = gm.client_id WHERE gm.group_id = ?',
      [groupId]
    );

    const [attendance]: any = await pool.query(
      'SELECT client_id, attendance_status, amount_charged FROM lesson_attendance WHERE lesson_id = ?',
      [lessonId]
    );

    return res.json({
      students,
      attendance
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllAvailableTeachers = async (req: Request, res: Response) => {
  try {
    const [allTeachers]: any = await pool.query(
      'SELECT id, company_id, full_name, role FROM users'
    );
    return res.json(allTeachers);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLessonsList = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, lesson_date, start_time, end_time, status, group_id, user_id, teacher_pay FROM lessons WHERE lesson_date BETWEEN ? AND ?',
      [start, end]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
