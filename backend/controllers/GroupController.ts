import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";

export const getgroups = async (req: Request, res: Response) => {
  let connect: PoolConnection | undefined;

  try {
    connect = await pool.getConnection();
    if (!connect) throw new Error("don't connect with database");

    const company_id = req.session.company_id;
    const [groups] = await connect.query(
      "SELECT g.* FROM `groups` g JOIN users u ON g.users_id = u.id WHERE u.company_id = ?",
      [company_id],
    );

    const rows = groups as any[];
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (ex) {
    console.log(ex);
    return res.status(400).json({
      success: false,
      message: "Couldn't get list of group",
    });
  }
};
export const creategroup = async (req: Request, res: Response) => {
  let connect;

  try {
    const { name, users_id, status, schedules } = req.body;

    if (!name || !users_id || status === undefined) {
      return res.status(400).json({ message: "Не все обязательные поля заполнены" });
    }

    connect = await pool.getConnection();
    if (!connect) throw new Error("don't connect with database");

    await connect.beginTransaction();

    const [groupResult]: any = await connect.query(
      'INSERT INTO `groups` (name, users_id, status) VALUES (?, ?, ?)',
      [name, users_id, status]
    );

    const newGroupId = groupResult.insertId;

    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      
      const scheduleValues = schedules.map((item: any) => [
        item.day_of_week,
        item.start_time,
        item.end_time,
        newGroupId
      ]);

      await connect.query(
        'INSERT INTO `group_schedules` (day_of_week, start_time, end_time, group_id) VALUES ?',
        [scheduleValues]
      );
    }

    await connect.commit();

    return res.status(201).json({
      message: "Группа и расписание успешно созданы",
      groupId: newGroupId
    });

  } catch (error: any) {
    if (connect) await connect.rollback();
    
    console.error("Ошибка при создании группы:", error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера", error: error.message });
  } finally {
    if (connect) connect.release();
  }
};
