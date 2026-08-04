import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getgroups = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [groups] = await pool.query<RowDataPacket[]>(
      `SELECT 
        g.id,
        g.name,
        g.users_id,
        g.status,
        g.start_date,
        g.end_date,
        g.max_students,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS studentsCount,
        
        (
          SELECT MIN(
            CASE gs_sub.day_of_week
              WHEN 'Понедельник' THEN DATE_ADD(CURRENT_DATE(), INTERVAL (8 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Вторник'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (9 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Среда'       THEN DATE_ADD(CURRENT_DATE(), INTERVAL (10 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Четверг'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (11 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Пятница'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (12 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Суббота'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (13 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Воскресенье' THEN DATE_ADD(CURRENT_DATE(), INTERVAL (14 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
            END
          )
          FROM group_schedules gs_sub
          WHERE gs_sub.group_id = g.id
        ) AS nextMeeting,

        IF(COUNT(gs.id) = 0, JSON_ARRAY(), 
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'day_of_week', gs.day_of_week, 
              'start_time', gs.start_time, 
              'end_time', gs.end_time
            )
          )
        ) AS schedules
      FROM \`groups\` g 
      INNER JOIN users u ON g.users_id = u.id 
      LEFT JOIN group_schedules gs ON g.id = gs.group_id 
      WHERE u.company_id = ? 
      GROUP BY g.id`,
      [company_id],
    );

    const formattedGroups = (groups as any[]).map((group) => {
      let parsedSchedules = group.schedules;

      if (typeof group.schedules === "string") {
        try {
          parsedSchedules = JSON.parse(group.schedules);
        } catch {
          parsedSchedules = [];
        }
      }

      const startDateObj = group.start_date ? new Date(group.start_date) : null;
      const endDateObj = group.end_date ? new Date(group.end_date) : null;
      const nextMeetingObj = group.nextMeeting ? new Date(group.nextMeeting) : null;

      return {
        ...group,
        schedules: parsedSchedules,
        studentsCount: Number(group.studentsCount || 0),
        start_date: startDateObj,       
        end_date: endDateObj,        
        nextMeeting: nextMeetingObj,   
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedGroups,
    });
  } catch (ex) {
    console.error("Ошибка при получении групп и расписания:", ex);
    return res.status(500).json({
      success: false,
      message: "Couldn't get list of groups",
    });
  }
};


export const creategroup = async (req: Request, res: Response) => {
  const company_id = req.session.company_id;
  if (!company_id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let connect;

  try {
    const {
      name,
      users_id,
      status,
      schedules,
      start_date,
      end_date,
      max_students,
    } = req.body;

    if (!name || !users_id || status === undefined || !start_date) {
      return res
        .status(400)
        .json({ message: "Не все обязательные поля заполнены" });
    }

    // Преобразуем входящие строки дат в полноценные экземпляры класса Date
    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : null;

    connect = await pool.getConnection();
    await connect.beginTransaction();

    const [groupResult] = await connect.query<ResultSetHeader>(
      "INSERT INTO `groups` (name, users_id, status, start_date, end_date, max_students) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        users_id,
        status,
        startDateObj, // Передаем объект Date
        endDateObj,   // Передаем объект Date или null
        max_students || null,
      ],
    );

    const newGroupId = groupResult.insertId;

    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      const scheduleValues = schedules.map((item: any) => [
        item.day_of_week,
        item.start_time,
        item.end_time,
        newGroupId,
      ]);

      await connect.query(
        "INSERT INTO `group_schedules` (day_of_week, start_time, end_time, group_id) VALUES ?",
        [scheduleValues],
      );
    }

    await connect.commit();

    return res.status(201).json({
      message: "Группа и расписание успешно созданы",
      groupId: newGroupId,
    });
  } catch (error: any) {
    if (connect) {
      await connect.rollback();
    }
    console.error("Ошибка при создании группы:", error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  } finally {
    if (connect) {
      connect.release();
    }
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const groupId = parseInt(req.params.id as string, 10);
  const companyId = req.session.company_id;

  if (isNaN(groupId) || !companyId) {
    res
      .status(400)
      .json({ error: "Некорректный ID группы или вы не авторизованы" });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [groupRows] = await connection.execute<RowDataPacket[]>(
      `SELECT g.id 
       FROM \`groups\` g
       JOIN users u ON g.users_id = u.id
       WHERE g.id = ? AND u.company_id = ?`,
      [groupId, companyId],
    );

    if (groupRows.length === 0) {
      await connection.rollback();
      res
        .status(404)
        .json({ error: "Группа не найдена или у вас нет прав на её удаление" });
      return;
    }

    await connection.execute(`DELETE FROM group_schedules WHERE group_id = ?`, [
      groupId,
    ]);

    await connection.execute(`DELETE FROM lessons WHERE group_id = ?`, [
      groupId,
    ]);

    await connection.execute(`DELETE FROM group_members WHERE group_id = ?`, [
      groupId,
    ]);

    await connection.execute(`DELETE FROM \`groups\` WHERE id = ?`, [groupId]);

    await connection.commit();
    res.status(200).json({
      success: true,
      message: "Группа и все её связанные данные успешно удалены",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Ошибка при удалении группы:", error);
    res
      .status(500)
      .json({ error: "Внутренняя ошибка сервера при удалении группы" });
  } finally {
    connection.release();
  }
};

export const updategroup = async (req: Request, res: Response) => {
  const group_id = req.params.id;
  const company_id = req.session.company_id;

  if (!company_id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const {
    name,
    users_id,
    status,
    schedules,
    start_date,
    end_date,
    max_students,
  } = req.body;

  const connection = await pool.getConnection();

  const formattedStartDate = (start_date === "" || !start_date) ? null : new Date(start_date);
  const formattedEndDate = (end_date === "" || !end_date) ? null : new Date(end_date);

  try {
    await connection.beginTransaction();

    const [groupCheck] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM `groups` WHERE id = ?",
      [group_id],
    );

    if (groupCheck.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Группа с таким ID не найдена" });
    }

    const [userCheck] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? AND company_id = ?",
      [users_id, company_id],
    );

    if (userCheck.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Указанный преподаватель не найден в вашей компании или доступ запрещен",
      });
    }

    await connection.query(
      `UPDATE \`groups\` SET name = ?, users_id = ?, status = ?, start_date = ?, end_date = ?, max_students = ? WHERE id = ?`,
      [
        name,
        users_id,
        status,
        formattedStartDate,
        formattedEndDate,  
        max_students,
        group_id,
      ],
    );

    if (schedules && Array.isArray(schedules)) {
      await connection.query("DELETE FROM group_schedules WHERE group_id = ?", [
        group_id,
      ]);

      if (schedules.length > 0) {
        const scheduleValues = schedules.map((s: any) => [
          s.day_of_week,
          s.start_time,
          s.end_time,
          group_id,
        ]);

        await connection.query(
          "INSERT INTO group_schedules (day_of_week, start_time, end_time, group_id) VALUES ?",
          [scheduleValues],
        );
      }
    }

    await connection.commit();
    return res
      .status(200)
      .json({ success: true, message: "Группа успешно обновлена" });
  } catch (er) {
    await connection.rollback();
    console.error(er);
    return res.status(500).json({ success: false, message: er });
  } finally {
    connection.release();
  }
};