import { AccessError, ownedGroup, ownedUser, recordId, respondToAccessError } from "../security/ownership.js";
import { authorize } from "../middleware/auth.js";
import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
export const getSchedule = async (req: Request, res: Response) => {
  if (!authorize(req, res, 0)) return;

  try {
    const company_id = req.session.company_id;
    if (!company_id || company_id === -1) {
      return res
        .status(401)
        .json({ success: false, message: "user is unauthorized" });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
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
      data: { templates, realLessons },
    });
  } catch (error) {
    console.error("Error in getSchedule:", error);
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

export const getLessonDetails = async (req: Request, res: Response) => {
  if (!authorize(req, res, 0)) return;

  try {
    const id = req.params.id as string;
    const company_id = req.session.company_id;
    const user_rank = Number(req.session.rank || 0); 
    const current_user_id = req.session.user_id;    

    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let lessonData: any = null;
    let groupId: number = 0;
    let attendanceData: any[] = [];
    let isReadOnly = false; 

    if (id.startsWith("temp-")) {
      const [, scheduleId, year, month, day] = id.split("-");
      const dateStr = `${year}-${month}-${day}`;

      const [scheduleRows]: any = await pool.query(
        `SELECT gs.start_time, gs.end_time, gs.group_id, g.name AS group_name, g.users_id AS teacher_id
         FROM group_schedules gs
         JOIN \`groups\` g ON gs.group_id = g.id
         JOIN users u ON g.users_id = u.id
         WHERE gs.id = ? AND u.company_id = ?`,
        [scheduleId, company_id],
      );

      if (!scheduleRows.length) {
        return res.status(404).json({ success: false, message: "Schedule template not found" });
      }

      const s = scheduleRows[0];
      groupId = s.group_id;

      if (user_rank < 500 && Number(s.teacher_id) !== Number(current_user_id)) {
        isReadOnly = true; 
      }

      lessonData = {
        id: id,
        lesson_date: new Date(dateStr),
        start_time: s.start_time,
        end_time: s.end_time,
        status: 1,
        group_id: s.group_id,
        teacher_id: s.teacher_id, 
        teacher_pay: 1500.00,
      };

      const [groupStudents]: any = await pool.query(
        "SELECT gm.client_id FROM group_members gm JOIN clients c ON c.id = gm.client_id WHERE gm.group_id = ? AND c.company_id = ?",
        [groupId, company_id],
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

      const [lessonRows]: any = await pool.query(
        `SELECT l.id, l.lesson_date, l.start_time, l.end_time, l.status, l.group_id, l.user_id, l.teacher_pay 
         FROM lessons l 
         JOIN \`groups\` g ON l.group_id = g.id
         JOIN users u ON g.users_id = u.id
         WHERE l.id = ? AND u.company_id = ?`,
        [lessonId, company_id],
      );

      if (!lessonRows.length) {
        return res.status(404).json({ success: false, message: "Lesson not found" });
      }

      const l = lessonRows[0];
      groupId = l.group_id;

      if (Number(l.status) === 2 || (user_rank < 500 && Number(l.user_id) !== Number(current_user_id))) {
        isReadOnly = true;
      }

      lessonData = {
        id: l.id,
        lesson_date: new Date(l.lesson_date),
        start_time: l.start_time,
        end_time: l.end_time,
        status: l.status,
        group_id: l.group_id,
        teacher_id: l.user_id, 
        teacher_pay: l.teacher_pay,
      };

      const [attRows]: any = await pool.query(
        "SELECT la.client_id, la.attendance_status, la.amount_charged FROM lesson_attendance la JOIN clients c ON c.id = la.client_id WHERE la.lesson_id = ? AND c.company_id = ?",
        [lessonId, company_id],
      );
      attendanceData = attRows;
    }

    const [groupRows]: any = await pool.query("SELECT id, name FROM `groups` WHERE id = ?", [groupId]);
    
    const isForeignLessonForTeacher = user_rank < 500 && Number(lessonData.teacher_id) !== Number(current_user_id);
    const studentFields = isForeignLessonForTeacher ? "c.id, c.name, 0 AS balance" : "c.id, c.name, c.balance";
    
    const [studentsData]: any = await pool.query(
      `SELECT ${studentFields} FROM clients c JOIN group_members gm ON c.id = gm.client_id WHERE gm.group_id = ? AND c.company_id = ?`,
      [groupId, company_id],
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
        isReadOnly
      },
    });
  } catch (error) {
    console.error("Ошибка в getLessonDetails:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const closeLesson = async (req: Request, res: Response): Promise<void> => {
  if (!authorize(req, res, 0)) return;

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
  const user_rank = Number(req.session.rank || 0); 
  const current_user_id = req.session.user_id;    

  if (
    !lessonId ||
    !groupId ||
    !startDateTime ||
    !endDateTime ||
    !teacherId ||
    !Array.isArray(students)
  ) {
    res.status(400).json({ error: "Переданы некорректные или неполные данные формы" });
    return;
  }

  if (user_rank < 500 && Number(teacherId) !== Number(current_user_id)) {
    res.status(403).json({ error: "У вас нет прав на сохранение или закрытие чужого урока!" });
    return;
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "Неверный формат даты и времени" });
    return;
  }

  const strLessonDate = String(startDateTime).split("T")[0];
  const strStartTime = String(startDateTime).split("T")[1].substring(0, 8);
  const strEndTime = String(endDateTime).split("T")[1].substring(0, 8);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const group = await ownedGroup(connection, groupId, company_id!);
    await ownedUser(connection, teacherId, company_id!);

    let existingLesson: any = null;
    if (typeof lessonId === "string" && lessonId.startsWith("temp-")) {
      const match = /^temp-([1-9]\d*)-(\d{4}-\d{2}-\d{2})$/.exec(lessonId);
      if (!match || match[2] !== strLessonDate) throw new AccessError(400, "Invalid schedule occurrence");
      const [templates] = await connection.query<RowDataPacket[]>(
        "SELECT id, start_time FROM group_schedules WHERE id = ? AND group_id = ? FOR UPDATE",
        [recordId(match[1]), recordId(groupId)]);
      if (!templates.length) throw new AccessError(404, "Schedule not found");
      const [scheduledLessons] = await connection.query<RowDataPacket[]>(
        "SELECT id, lesson_date, start_time, end_time, group_id, user_id, teacher_pay, status FROM lessons WHERE group_id = ? AND lesson_date = ? AND start_time = ? FOR UPDATE",
        [recordId(groupId), strLessonDate, String(templates[0].start_time).slice(0, 8)]);
      existingLesson = scheduledLessons[0] || null;
      if (user_rank < 500 && Number(group.users_id) !== Number(current_user_id)) {
        throw new AccessError(403, "Cannot close another teacher's lesson");
      }
    } else {
      const [lessons] = await connection.query<RowDataPacket[]>(
        "SELECT l.id, l.lesson_date, l.start_time, l.end_time, l.group_id, l.user_id, l.status, l.teacher_pay FROM lessons l JOIN `groups` g ON g.id = l.group_id JOIN users u ON u.id = g.users_id WHERE l.id = ? AND u.company_id = ? FOR UPDATE",
        [recordId(lessonId), company_id]);
      existingLesson = lessons[0];
      if (!existingLesson) throw new AccessError(404, "Lesson not found");
      if (Number(existingLesson.user_id) !== Number(teacherId) && Number(req.session.rank) < 1000) {
        throw new AccessError(403, "Cannot reassign a lesson to another teacher");
      }
      if (Number(existingLesson.group_id) !== Number(groupId)) throw new AccessError(400, "Lesson/group mismatch");
      if (user_rank < 500 && (Number(existingLesson.user_id) !== Number(current_user_id) || Number(existingLesson.status) === 2)) {
        throw new AccessError(403, "Lesson is read-only");
      }
    }
    const studentIds = students.map((student: any) => recordId(student.clientId));
    if (new Set(studentIds).size !== studentIds.length) throw new AccessError(400, "Duplicate students");
    for (const clientId of studentIds) {
      const [members] = await connection.query<RowDataPacket[]>(
        "SELECT c.id FROM clients c JOIN group_members gm ON gm.client_id = c.id WHERE c.id = ? AND c.company_id = ? AND gm.group_id = ?",
        [clientId, company_id, recordId(groupId)]);
      if (!members.length) throw new AccessError(404, "Group member not found");
    }

    // === ФИНАНСОВАЯ МОДЕРАЦИЯ ДЛЯ УЧИТЕЛЯ ===
    let finalTeacherPay = Number(teacherPay);
    let validatedStudents = students;

    if (user_rank < 500) {
      // Retain the existing planned payment; never use accumulated balance as a rate.
      finalTeacherPay = existingLesson ? Number(existingLesson.teacher_pay) : 1500.00;

      validatedStudents = students.map((s: any) => ({
        ...s,
        amountCharged: 800.00 
      }));
    }

    let realLessonId: number;
    let isAlreadyClosed = Number(existingLesson?.status) === 2;

    if (isAlreadyClosed) {
      const sameDate = String(existingLesson.lesson_date).slice(0, 10) === strLessonDate;
      const sameStart = String(existingLesson.start_time).slice(0, 8) === strStartTime;
      const sameEnd = String(existingLesson.end_time).slice(0, 8) === strEndTime;
      const sameTeacher = Number(existingLesson.user_id) === Number(teacherId);
      const samePay = Math.round(Number(existingLesson.teacher_pay) * 100) === Math.round(finalTeacherPay * 100);
      if (sameDate && sameStart && sameEnd && sameTeacher && samePay) {
        const lessonIdToCheck = Number(existingLesson.id);
        const [savedAttendance] = await connection.query<RowDataPacket[]>(
          "SELECT client_id, attendance_status, amount_charged FROM lesson_attendance WHERE lesson_id = ? ORDER BY client_id",
          [lessonIdToCheck]);
        const expectedAttendance = validatedStudents.map((student: any) => ({
          client_id: Number(student.clientId),
          attendance_status: Number(student.attendanceStatus),
          amount_charged: Math.round(Number(student.amountCharged) * 100),
        })).sort((a, b) => a.client_id - b.client_id);
        const currentAttendance = savedAttendance.map(row => ({
          client_id: Number(row.client_id),
          attendance_status: Number(row.attendance_status),
          amount_charged: Math.round(Number(row.amount_charged) * 100),
        }));
        const attendanceMatches = JSON.stringify(currentAttendance) === JSON.stringify(expectedAttendance);
        const [savedTransactions] = await connection.query<RowDataPacket[]>(
          "SELECT client_id, user_id, type, amount FROM financial_transactions WHERE lesson_id = ? AND company_id = ? ORDER BY type, client_id, user_id",
          [lessonIdToCheck, company_id]);
        const expectedTransactions = [
          ...validatedStudents.filter((student: any) => Number(student.attendanceStatus) === 1 && Number(student.amountCharged) > 0)
            .map((student: any) => ({ client_id: Number(student.clientId), user_id: null, type: "revenue", amount: Math.round(Number(student.amountCharged) * 100) })),
          ...(finalTeacherPay > 0 ? [{ client_id: null, user_id: Number(teacherId), type: "expense", amount: Math.round(finalTeacherPay * 100) }] : []),
        ].sort((a, b) => a.type.localeCompare(b.type) || Number(a.client_id || a.user_id) - Number(b.client_id || b.user_id));
        const currentTransactions = savedTransactions.map(row => ({
          client_id: row.client_id == null ? null : Number(row.client_id),
          user_id: row.user_id == null ? null : Number(row.user_id),
          type: row.type,
          amount: Math.round(Number(row.amount) * 100),
        }));
        if (attendanceMatches && JSON.stringify(currentTransactions) === JSON.stringify(expectedTransactions)) {
          await connection.commit();
          res.status(200).json({ success: true, realLessonId: lessonIdToCheck, idempotent: true, message: `Урок №${lessonIdToCheck} уже проведён с теми же данными.` });
          return;
        }
      }
    }

    if (isNaN(Number(lessonId)) && !existingLesson) {
      const [insertLessonResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO lessons (lesson_date, start_time, end_time, status, group_id, user_id, teacher_pay) 
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [strLessonDate, strStartTime, strEndTime, groupId, teacherId, finalTeacherPay],
      );
      realLessonId = insertLessonResult.insertId;
    } else {
      realLessonId = Number(existingLesson?.id ?? lessonId);

      if (existingLesson && Number(existingLesson.status) === 2) {

          const [oldTransactions]: any = await connection.query(
            "SELECT client_id, user_id, type, amount FROM financial_transactions WHERE lesson_id = ? AND company_id = ?",
            [realLessonId, company_id]
          );

          for (const tx of oldTransactions) {
            if (tx.type === 'revenue' && tx.client_id) {
              await connection.query("UPDATE clients SET balance = balance + ? WHERE id = ? AND company_id = ?", [tx.amount, tx.client_id, company_id]);
            }
            if (tx.type === 'expense' && tx.user_id) {
              await connection.query("UPDATE users SET balance = balance - ? WHERE id = ? AND company_id = ?", [tx.amount, tx.user_id, company_id]);
            }
          }

          await connection.query("DELETE FROM financial_transactions WHERE lesson_id = ? AND company_id = ?", [realLessonId, company_id]);
      }

      await connection.query(
        `UPDATE lessons 
         SET lesson_date = ?, start_time = ?, end_time = ?, user_id = ?, teacher_pay = ?
         WHERE id = ?`,
        [strLessonDate, strStartTime, strEndTime, teacherId, finalTeacherPay, realLessonId],
      );
    }

    for (const student of validatedStudents) {
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

    const strTodayDate = now.toLocaleDateString('en-CA'); 

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

    await connection.query("UPDATE lessons SET status = 2 WHERE id = ?", [realLessonId]);

    for (const student of validatedStudents) {
      if (Number(student.attendanceStatus) === 1 && student.amountCharged > 0) {
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

        await connection.query(
          "UPDATE clients SET balance = balance - ? WHERE id = ? AND company_id = ?",
          [student.amountCharged, student.clientId, company_id],
        );
      }
    }

    if (finalTeacherPay > 0) {
      await connection.query(
        `INSERT INTO financial_transactions (company_id, lesson_id, client_id, user_id, amount, type, description) 
         VALUES (?, ?, NULL, ?, ?, 'expense', ?)`,
        [
          company_id,
          realLessonId,
          teacherId,
          finalTeacherPay,
          `Начисление вознаграждения за проведение урока №${realLessonId}`
        ]
      );

      await connection.query(
        "UPDATE users SET balance = balance + ? WHERE id = ? AND company_id = ?",
        [finalTeacherPay, teacherId, company_id],
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      realLessonId: realLessonId,
      message: isAlreadyClosed
        ? `Урок №${realLessonId} успешно пересчитан в единой кассу.`
        : `Урок №${realLessonId} проведен. Новые финансовые проводки добавлены в кассу.`,
    });
  } catch (error: any) {
    await connection.rollback();
    if (respondToAccessError(error, res)) return;
    console.error("Ошибка в closeLesson:", error);
    if (error.message.includes("403")) {
      res.status(403).json({ error: "Доступ ограничен" });
    } else {
      res.status(500).json({ error: error.message || "Ошибка сервера" });
    }
  } finally {
    connection.release();
  }
};

