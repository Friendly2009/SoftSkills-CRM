import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const getSchedule = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id || -1;
    if (company_id === -1) {
      return res.status(401).json({
        success: false,
        message: "user is unauthorized",
      });
    }
    const [rows] = await pool.query(
      "select * from select_schedules_of_groups WHERE company_id = ?",
      [company_id],
    );
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);
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
    console.log(id);
    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let lessonData: any = null;
    let groupId: number = 0;
    let attendanceData: any[] = [];

    if (id.startsWith("temp-")) {
      const [, scheduleId, year, month, day] = id.split("-");
      const dateStr = `${year}-${month}-${day}`;

      const [scheduleRows]: any = await pool.query(
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

      lessonData = {
        id: id,
        lesson_date: new Date(dateStr),
        start_time: s.start_time,
        end_time: s.end_time,
        status: 1,
        group_id: s.group_id,
        user_id: s.teacher_id,
        teacher_pay: 1500,
      };
    } else {
      const lessonId = parseInt(id, 10);
      if (isNaN(lessonId))
        return res.status(400).json({ error: "Invalid ID format" });

      const [lessonRows]: any = await pool.query(
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

      lessonData = lessonRows[0];
      groupId = lessonData.group_id;

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
