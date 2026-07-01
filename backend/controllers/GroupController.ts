import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const getgroups = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    const [groups] = await pool.query(
      `SELECT 
        g.*, 
        COUNT(DISTINCT gm.client_id) AS studentsCount, -- Считаем уникальных студентов в группе
        IF(COUNT(gs.id) > 0, 
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'day_of_week', gs.day_of_week, 
              'start_time', gs.start_time, 
              'end_time', gs.end_time
            )
          ), 
          JSON_ARRAY()
        ) AS schedules
      FROM \`groups\` g 
      JOIN users u ON g.users_id = u.id 
      LEFT JOIN group_schedules gs ON g.id = gs.group_id
      LEFT JOIN group_members gm ON g.id = gm.group_id -- Присоединяем таблицу связей студентов
      WHERE u.company_id = ?
      GROUP BY g.id`,
      [company_id],
    );

    const formattedGroups = (groups as any[]).map((group) => ({
      ...group,
      schedules:
        typeof group.schedules === "string"
          ? JSON.parse(group.schedules)
          : group.schedules,
      studentsCount: Number(group.studentsCount || 0),
    }));

    return res.status(200).json({
      success: true,
      data: formattedGroups,
    });
  } catch (ex) {
    console.error("Ошибка при получении групп и расписания:", ex);
    return res.status(500).json({
      success: false,
      message: "Couldn't get list of group",
    });
  }
};

export const creategroup = async (req: Request, res: Response) => {
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

    connect = await pool.getConnection();
    await connect.beginTransaction();

    const [groupResult]: any = await connect.query(
      "INSERT INTO `groups` (name, users_id, status, start_date, end_date, max_students) VALUES (?, ?, ?, ?, ?, ?)",
      [name, users_id, status, start_date, end_date || null, max_students],
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
