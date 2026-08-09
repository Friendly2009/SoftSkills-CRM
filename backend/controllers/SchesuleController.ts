import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
export const getSchedule = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || company_id === -1) {
      return res.status(401).json({
        success: false,
        message: "user is unauthorized",
      });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing startDate or endDate parameters",
      });
    }

    const [templates] = await pool.query(
      "SELECT * FROM select_schedules_of_groups WHERE company_id = ?",
      [company_id],
    );

    const [realLessons] = await pool.query(
      `SELECT l.id, l.lesson_date, l.start_time, l.end_time, l.status, l.group_id, g.name AS group_name
       FROM lessons l
       JOIN \`groups\` g ON l.group_id = g.id
       JOIN users u ON g.users_id = u.id
       WHERE u.company_id = ? AND l.lesson_date BETWEEN ? AND ?`,
      [company_id, startDate, endDate],
    );

    return res.status(200).json({
      success: true,
      data: {
        templates,
        realLessons,
      },
    });
  } catch (error) {
    console.error("Error in getSchedule:", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
};

export const getLessonDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const company_id = req.session.company_id;
    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let lessonData: any = null;
    let groupId: number = 0;
    let attendanceData: any[] = [];

    if (id.startsWith("temp-")) {
      const [, scheduleId, year, month, day] = id.split("-");
      const dateStr = `${year}-${month}-${day}`;

      const [scheduleRows]: any = await pool.query<RowDataPacket[]>(
        `SELECT gs.start_time, gs.end_time, gs.group_id, g.name AS group_name, g.users_id AS teacher_id,
                u.balance AS default_pay
         FROM group_schedules gs
         JOIN \`groups\` g ON gs.group_id = g.id
         JOIN users u ON g.users_id = u.id
         WHERE gs.id = ? AND u.company_id = ?`,
        [scheduleId, company_id],
      );

      if (!scheduleRows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule template not found" });
      }

      const s = scheduleRows[0];
      groupId = s.group_id;

      const lessonDateObj = new Date(dateStr);

      lessonData = {
        id: id,
        lesson_date: lessonDateObj,
        start_time: s.start_time,
        end_time: s.end_time,
        status: 1,
        group_id: s.group_id,
        user_id: s.teacher_id,
        teacher_pay: 1500.00,
      };
      const [groupStudents]: any = await pool.query(
        "SELECT client_id FROM group_members WHERE group_id = ?",
        [groupId],
      );

      attendanceData = groupStudents.map((student: any) => ({
        client_id: student.client_id,
        attendance_status: 1,
        amount_charged: 800.0,
      }));
    } else {
      const lessonId = parseInt(id, 10);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const [lessonRows]: any = await pool.query<RowDataPacket[]>(
        `SELECT l.id, l.lesson_date, l.start_time, l.end_time, l.status, l.group_id, l.user_id, l.teacher_pay 
         FROM lessons l 
         JOIN \`groups\` g ON l.group_id = g.id
         JOIN users u ON g.users_id = u.id
         WHERE l.id = ? AND u.company_id = ?`,
        [lessonId, company_id],
      );

      if (!lessonRows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Lesson not found" });
      }

      const l = lessonRows[0];
      groupId = l.group_id;

      lessonData = {
        id: l.id,
        lesson_date: new Date(l.lesson_date),
        start_time: l.start_time,
        end_time: l.end_time,
        status: l.status,
        group_id: l.group_id,
        user_id: l.user_id,
        teacher_pay: l.teacher_pay,
      };

      const [attRows]: any = await pool.query(
        "SELECT client_id, attendance_status, amount_charged FROM lesson_attendance WHERE lesson_id = ?",
        [lessonId],
      );
      attendanceData = attRows;
    }

    const [groupRows]: any = await pool.query(
      "SELECT id, name FROM `groups` WHERE id = ?",
      [groupId],
    );
    const [studentsData]: any = await pool.query(
      "SELECT c.id, c.name, c.balance FROM clients c JOIN group_members gm ON c.id = gm.client_id WHERE gm.group_id = ?",
      [groupId],
    );
    const [allTeachers]: any = await pool.query(
      "SELECT id, full_name, role FROM users WHERE company_id = ?",
      [company_id],
    );

    return res.status(200).json({
      success: true,
      data: {
        lesson: lessonData,
        group: groupRows[0] || { id: groupId, name: "Без названия" },
        students: studentsData,
        allTeachers,
        attendance: attendanceData,
      },
    });
  } catch (error) {
    console.error("Ошибка в getLessonDetails:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const closeLesson = async (req: Request, res: Response): Promise<void> => {
  const {
    lessonId,
    groupId,
    startDateTime,
    endDateTime,
    teacherId,
    teacherPay,
    students,
  } = req.body;

  const company_id = req.session.company_id;

  if (
    !lessonId ||
    !groupId ||
    !startDateTime ||
    !endDateTime ||
    !teacherId ||
    !students
  ) {
    res.status(400).json({ error: "Переданы некорректные или неполные данные формы" });
    return;
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "Неверный формат даты и времени" });
    return;
  }

  // Строковый парсинг строк дат (фронт шлет в конце Z)
  const strLessonDate = String(startDateTime).split("T")[0];
  const strStartTime = String(startDateTime).split("T")[1].substring(0, 8);
  const strEndTime = String(endDateTime).split("T")[1].substring(0, 8);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    let realLessonId: number;
    let isAlreadyClosed = false;

    if (isNaN(Number(lessonId))) {
      // Фантомный урок -> Создаем новую строчку в lessons со статусом 1 (Запланирован)
      const [insertLessonResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO lessons (lesson_date, start_time, end_time, status, group_id, user_id, teacher_pay) 
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [strLessonDate, strStartTime, strEndTime, groupId, teacherId, teacherPay],
      );
      realLessonId = insertLessonResult.insertId;
    } else {
      // Реальный существующий урок
      realLessonId = Number(lessonId);

      const [rows]: any = await connection.query<RowDataPacket[]>(
        "SELECT status FROM lessons WHERE id = ?",
        [realLessonId],
      );

      // Если урок уже был проведен и закрыт (status === 2), откатываем старые балансы
      if (rows.length > 0 && Number(rows[0].status) === 2) {
        isAlreadyClosed = true;

        // Находим абсолютно все старые строки начислений/списаний по этому lesson_id из одной таблицы
        const [oldTransactions]: any = await connection.query(
          "SELECT client_id, user_id, type, amount FROM financial_transactions WHERE lesson_id = ?",
          [realLessonId]
        );

        for (const tx of oldTransactions) {
          if (tx.type === 'revenue' && tx.client_id) {
            // Возвращаем списанные за урок деньги обратно на баланс клиента
            await connection.query("UPDATE clients SET balance = balance + ? WHERE id = ?", [tx.amount, tx.client_id]);
          }
          if (tx.type === 'expense' && tx.user_id) {
            // Изымаем начисленную зарплату с баланса преподавателя
            await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [tx.amount, tx.user_id]);
          }
        }

        // В один клик стираем старые финансовые операции по уроку из одной таблицы
        await connection.query("DELETE FROM financial_transactions WHERE lesson_id = ?", [realLessonId]);
      }

      // Обновляем параметры урока
      await connection.query(
        `UPDATE lessons 
         SET lesson_date = ?, start_time = ?, end_time = ?, user_id = ?, teacher_pay = ?
         WHERE id = ?`,
        [strLessonDate, strStartTime, strEndTime, teacherId, teacherPay, realLessonId],
      );
    }

    // Фиксируем или обновляем отметки посещаемости в lesson_attendance
    for (const student of students) {
      await connection.query(
        `INSERT INTO lesson_attendance (lesson_id, client_id, attendance_status, amount_charged)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE attendance_status = ?, amount_charged = ?`,
        [
          realLessonId,
          student.clientId,
          student.attendanceStatus,
          student.amountCharged,
          student.attendanceStatus,
          student.amountCharged,
        ],
      );
    }

    const strTodayDate = now.toLocaleDateString('en-CA'); // Формат YYYY-MM-DD локально на сервере

    // Проверяем: если дата урока в будущем, транзакции не проводим, сохраняем статус 1
    if (strLessonDate > strTodayDate) {
      await connection.query("UPDATE lessons SET status = 1 WHERE id = ?", [realLessonId]);
      await connection.commit();
      res.status(200).json({
        success: true,
        realLessonId: realLessonId,
        message: `Урок №${realLessonId} успешно сохранен на будущее со статусом Запланирован. Балансы не тронуты.`,
      });
      return;
    }

    // Если урок сегодня или в прошлом — переводим в статус 2 (Проведен) и запускаем расчеты
    await connection.query("UPDATE lessons SET status = 2 WHERE id = ?", [realLessonId]);

    // Цикл генерации транзакций списания со студентов (Тип: revenue)
    for (const student of students) {
      if (Number(student.attendanceStatus) === 1 && student.amountCharged > 0) {
        // Записываем строчку выручки в общую таблицу
        await connection.query(
          `INSERT INTO financial_transactions (company_id, lesson_id, client_id, user_id, amount, type, description) 
           VALUES (?, ?, ?, NULL, ?, 'revenue', ?)`,
          [
            company_id,
            realLessonId,
            student.clientId,
            student.amountCharged,
            `Автоматическое списание за проведенный урок №${realLessonId}`
          ]
        );

        // Физически уменьшаем баланс кошелька студента
        await connection.query(
          "UPDATE clients SET balance = balance - ? WHERE id = ?",
          [student.amountCharged, student.clientId],
        );
      }
    }

    // Generation транзакции начисления преподавателю (Тип: expense)
    if (teacherPay > 0) {
      // Записываем строчку расхода в эту же общую таблицу
      await connection.query(
        `INSERT INTO financial_transactions (company_id, lesson_id, client_id, user_id, amount, type, description) 
         VALUES (?, ?, NULL, ?, ?, 'expense', ?)`,
        [
          company_id,
          realLessonId,
          teacherId,
          teacherPay,
          `Начисление вознаграждения за проведение урока №${realLessonId}`
        ]
      );

      // Физически увеличиваем кошелек преподавателя
      await connection.query(
        "UPDATE users SET balance = balance + ? WHERE id = ?",
        [teacherPay, teacherId],
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      realLessonId: realLessonId,
      message: isAlreadyClosed
        ? `Урок №${realLessonId} успешно пересчитан в единой кассе.`
        : `Урок №${realLessonId} проведен. Новые финансовые проводки добавлены в кассу.`,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Ошибка в closeLesson:", error);
    res.status(500).json({ error: error.message || "Ошибка сервера" });
  } finally {
    connection.release();
  }
};
