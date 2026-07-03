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
      `SELECT g.*, (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS studentsCount, IF(gs.id IS NULL, JSON_ARRAY(), JSON_ARRAYAGG( JSON_OBJECT('day_of_week', gs.day_of_week, 'start_time', gs.start_time, 'end_time', gs.end_time ))) AS schedules FROM \`groups\` g JOIN users u ON g.users_id = u.id LEFT JOIN group_schedules gs ON g.id = gs.group_id WHERE u.company_id = ? GROUP BY g.id, gs.group_id`,
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

    connect = await pool.getConnection();
    await connect.beginTransaction();

    const [groupResult] = await connect.query<ResultSetHeader>(
      "INSERT INTO `groups` (name, users_id, status, start_date, end_date, max_students) VALUES (?, ?, ?, ?, ?, ?)",
      [name, users_id, status, start_date, end_date || null, max_students || null],
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
