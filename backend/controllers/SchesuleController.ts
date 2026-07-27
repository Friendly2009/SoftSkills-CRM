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
        lesson_date: row.lesson_date ? new Date(row.lesson_date) : null, // Преобразовали в объект Date
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

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const [schedules]: any = await pool.query(
      `SELECT gs.id AS schedule_id, gs.day_of_week, gs.start_time, gs.end_time, gs.group_id, g.users_id AS default_teacher_id 
       FROM group_schedules gs 
       JOIN \`groups\` g ON gs.group_id = g.id 
       WHERE g.status = 1`
    );

    const [realLessons]: any = await pool.query(
      'SELECT id, lesson_date, start_time, end_time, status, group_id, user_id, teacher_pay FROM lessons WHERE lesson_date BETWEEN ? AND ?',
      [start, end]
    );

    const generatedLessons: any[] = [];
    const dayOfWeekMapping: Record<string, number> = {
      'воскресенье': 0, 'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4, 'пятница': 5, 'суббота': 6,
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
    };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentIsoDate = d.toISOString().split('T')[0];
      const currentDayIndex = d.getDay();

      schedules.forEach((sched: any) => {
        const targetDayIndex = dayOfWeekMapping[sched.day_of_week.toLowerCase()];
        
        if (targetDayIndex === currentDayIndex) {
          const existingRealLesson = realLessons.find((l: any) => {
            const lessonDateObj = new Date(l.lesson_date);
            return lessonDateObj.toISOString().split('T')[0] === currentIsoDate && 
                   l.group_id === sched.group_id &&
                   l.start_time === sched.start_time;
          });

          if (existingRealLesson) {
            generatedLessons.push({
              id: existingRealLesson.id,
              lesson_date: new Date(existingRealLesson.lesson_date),
              start_time: existingRealLesson.start_time,
              end_time: existingRealLesson.end_time,
              status: existingRealLesson.status,
              group_id: existingRealLesson.group_id,
              user_id: existingRealLesson.user_id,
              teacher_pay: existingRealLesson.teacher_pay
            });
          } else {
            generatedLessons.push({
              id: `temp-${sched.schedule_id}-${currentIsoDate}`,
              lesson_date: new Date(currentIsoDate),
              start_time: sched.start_time,
              end_time: sched.end_time,
              status: 1,
              group_id: sched.group_id,
              user_id: sched.default_teacher_id,
              teacher_pay: 0
            });
          }
        }
      });
    }

    return res.json(generatedLessons);
  } catch (error) {
    console.error("Ошибка в getLessonsList:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
