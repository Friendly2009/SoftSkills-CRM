import { Request, Response } from "express";
import db from "./../data_base_connect.js";
import { PoolConnection } from "mysql2/promise";

export const getUser = async (req: Request, res: Response): Promise<Response | void> => {
  const session = req.session as any;

  const userRole = session.role;
  const company_id = session.company_id;
  const company_name = session.company_name;
  const key_admin = session.key_admin;
  const key_user = session.key_user;

  const user_id = session.user_id;
  const full_name = session.user_full_name;
  const user_description = session.user_description;

  try {
    return res.status(200).json({
      userRole,
      company_id,
      company_name,
      key_admin,
      key_user,
      user_id,
      full_name,
      user_description,
    });
  } catch (ex) {
    console.error("Ошибка при получении данных пользователя:", ex);
    return res.status(400).json({ error: "Bad request" });
  }
};

export const getTeacher = async (req: Request, res: Response): Promise<Response | void> => {
  const session = req.session as any;
  const company_id = session.company_id;
  
  let connection: PoolConnection | undefined;

  try {
    connection = await (db as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();

    const [teachers]: any = await connection.query(
      `SELECT * FROM teachers WHERE company_id = ?`, 
      [company_id]
    );

    return res.status(200).json({
      data: teachers
    });

    await connection?.commit();
  } catch (ex) {
    console.error("Ошибка при получении списка преподавателей:", ex);
    if (connection) await connection.rollback();
    return res.status(500).json({ error: "Ошибка сервера при получении списка" });
  } finally {
    if (connection) connection.release();
  }
};
