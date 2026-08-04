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

export const closeLesson = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    lessonId,
    groupId,
    startDateTime,
    endDateTime, //считываем данные
    teacherId,
    teacherPay,
    students,
  } = req.body;

  const company_id = req.session.company_id; //то же самое

  if (
    !lessonId ||
    !groupId ||
    !startDateTime ||
    !endDateTime || //проверочка
    !teacherId ||
    !students
  ) {
    res
      .status(400)
      .json({ error: "Переданы некорректные или неполные данные формы" });
    return;
  }

  const start: Date = new Date(startDateTime); // |
  const end: Date = new Date(endDateTime); //      | Преобразования
  const now: Date = new Date(); //                 |

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "Неверный формат даты и времени" }); //если время херовое то откатываем все
    return;
  }
  const strLessonDate = String(startDateTime).split("T")[0];
  const strStartTime = String(startDateTime).split("T")[1].substring(0, 8);
  const strEndTime = String(endDateTime).split("T")[1].substring(0, 8);

  const connection = await pool.getConnection(); // вот тут пиздец начинается, получаем коннект с бд)

  try {
    await connection.beginTransaction();
    let realLessonId: number;
    let isAlreadyClosed = false;

    if (isNaN(Number(lessonId))) {
      // Фантомный урок -> Создаем новую запись со статусом 1 (Запланирован)
      const [insertLessonResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO lessons (lesson_date, start_time, end_time, status, group_id, user_id, teacher_pay) 
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [
          strLessonDate,
          strStartTime,
          strEndTime,
          groupId,
          teacherId,
          teacherPay,
        ],
      );
      realLessonId = insertLessonResult.insertId;
    } else {
      // Реальный урок -> Проверяем его текущий статус в базе
      realLessonId = Number(lessonId);

      const [rows]: any = await connection.query<RowDataPacket[]>(
        "SELECT status FROM lessons WHERE id = ?",
        [realLessonId],
      );

      // Если урок в базе уже имел статус 2 (Проведен), значит по нему были списания
      if (rows.length > 0 && Number(rows[0].status) === 2) {
        isAlreadyClosed = true;

        // Находим старую финансовую транзакцию для этого урока
        const [oldTx]: any = await connection.query(
          "SELECT id FROM financial_transactions WHERE lessons_id = ?",
          [realLessonId],
        );

        if (oldTx.length > 0) {
          const oldTxId = oldTx[0].id;

          // Получаем участников старой транзакции и делаем ПОЛНЫЙ ВОЗВРАТ балансов
          const [participants]: any = await connection.query(
            "SELECT client_id, user_id, role, amount FROM transaction_participants WHERE transaction_id = ?",
            [oldTxId],
          );

          for (const p of participants) {
            if (p.role === "payer" && p.client_id) {
              // Возвращаем деньги студенту
              await connection.query(
                "UPDATE clients SET balance = balance + ? WHERE id = ?",
                [p.amount, p.client_id],
              );
            }
            if (p.role === "recipient" && p.user_id) {
              // Забираем деньги у преподавателя
              await connection.query(
                "UPDATE users SET balance = balance - ? WHERE id = ?",
                [p.amount, p.user_id],
              );
            }
          }

          // Удаляем участников старой транзакции и саму финансовую операцию
          await connection.query(
            "DELETE FROM financial_transactions WHERE id = ?",
            [oldTxId],
          );
        }
      }

      // Обновляем параметры урока (пока оставляем старый статус, обновим его ниже)
      await connection.query(
        `UPDATE lessons 
         SET lesson_date = ?, start_time = ?, end_time = ?, user_id = ?, teacher_pay = ?
         WHERE id = ?`,
        [
          strLessonDate,
          strStartTime,
          strEndTime,
          teacherId,
          teacherPay,
          realLessonId,
        ],
      );
    }

    // Сохраняем или обновляем отметки посещаемости студентов
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

    // Текущая дата сервера в локальном формате YYYY-MM-DD
    const strTodayDate = now.toLocaleDateString("en-CA");

    // Если дата урока СТРОГО БОЛЬШЕ сегодняшней (Урок в будущем)
    if (strLessonDate > strTodayDate) {
      // Принудительно выставляем статус 1 (Запланирован)
      await connection.query("UPDATE lessons SET status = 1 WHERE id = ?", [
        realLessonId,
      ]);

      await connection.commit();
      res.status(200).json({
        success: true,
        realLessonId: realLessonId,
        message: `Урок №${realLessonId} успешно зафиксирован на будущее. Статус: Запланирован (1). Финансы не тронуты.`,
      });
      return;
    }

    // Урок прошел или идет сегодня -> ставим статус 2 (Проведен)
    await connection.query("UPDATE lessons SET status = 2 WHERE id = ?", [
      realLessonId,
    ]);

    // Создаем одну чистую запись финансовой транзакции
    const [txResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO financial_transactions (company_id, lessons_id, description) 
       VALUES (?, ?, ?)`,
      [
        company_id,
        realLessonId,
        `Проведение и закрытие урока №${realLessonId}`,
      ],
    );

    const transactionId = txResult.insertId;

    // Списываем деньги со студентов, которые БЫЛИ на занятии (attendanceStatus === 1)
    for (const student of students) {
      if (Number(student.attendanceStatus) === 1 && student.amountCharged > 0) {
        await connection.query(
          `INSERT INTO transaction_participants (transaction_id, client_id, user_id, role, amount) 
           VALUES (?, ?, NULL, 'payer', ?)`,
          [transactionId, student.clientId, student.amountCharged],
        );

        await connection.query(
          "UPDATE clients SET balance = balance - ? WHERE id = ?",
          [student.amountCharged, student.clientId],
        );
      }
    }

    // Начисляем выплату преподавателю
    if (teacherPay > 0) {
      await connection.query(
        `INSERT INTO transaction_participants (transaction_id, client_id, user_id, role, amount) 
         VALUES (?, NULL, ?, 'recipient', ?)`,
        [transactionId, teacherId, teacherPay],
      );

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
        ? `Урок №${realLessonId} успешно пересчитан. Балансы обновлены.`
        : `Урок №${realLessonId} успешно проведен. Списания завершены.`,
    });
  } catch (error: any) {
    await connection.rollback();//а это для уебков и будущих тестеров (им пизда)
    console.error("Ошибка в closeLesson:", error);
    res.status(500).json({ error: error.message || "Ошибка сервера" });
  } finally {
    connection.release();
  }
};
