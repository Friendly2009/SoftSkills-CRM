import { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";
import { text } from "body-parser";

export const index = (req: Request, res: Response): void => {
  res.status(200).json({
    message: "Добро пожаловать в API",
  });
};
export const index2 = (req: Request, res: Response): void => {
  res.status(200).json({
    message: "Добро пожаловать в index2",
  });
};
export const signup = (req: Request, res: Response): void => {
  res.status(200).json({
    page: "signup",
    title: "Регистрация новой компании",
  });
};
//INSERT INTO users (company_id, full_name, role, rank, email, password_hash, phone)
//VALUES (42, 'Иван Иванов', 'director', 1000, 'director@company.com', 'пароль', '+7...');

export const APIsignup = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { company, fullname, email, contact, password } = req.body;
  let connection: any; // меняем на any или импортируем правильный тип, чтобы не ругался TS

  try {
    connection = await (pool as any).getConnection();

    await connection.beginTransaction();

    const role = "Директор";
    const rank = 1000;

    const [newCompany]: any = await connection.query(
      "INSERT INTO company (name) VALUES (?)",
      [company],
    );

    const company_id = newCompany.insertId;

    const [initDirector]: any = await connection.query(
      "INSERT INTO users (company_id, full_name, role, users.rank, email, password_hash, contact) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [company_id, fullname, role, rank, email, password, contact],
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Company and director successfully created",
    });
  } catch (ex: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error(ex);

    if (ex.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

export const APIsignin = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  res.status(200).json({ success: true });
  //ЗАГЛУШКА
  const { company, login, password } = req.body;
  let connection: PoolConnection | undefined;

  try {
    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    const [companies]: any = await connection.query(
      "SELECT * FROM company WHERE name = ? AND (access_key_admin = ? OR access_key_user = ?)",
      [company, password, password],
    );

    if (companies.length > 0) {
      const currentCompany = companies[0];
      const userRole =
        currentCompany.access_key_admin === password ? "admin" : "user";

      const session = req.session as any;
      session.role = userRole;

      session.company_id = currentCompany.id;
      session.company_name = currentCompany.name;
      session.key_admin = currentCompany.access_key_admin;
      session.key_user = currentCompany.access_key_user;

      const [users]: any = await connection.query(
        "SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1",
        [currentCompany.id, userRole],
      );

      if (users.length > 0) {
        const currentUser = users[0];

        session.user_id = currentUser.id;
        session.user_full_name = currentUser.full_name;
        session.user_description = currentUser.description;
        session.db_user_role = currentUser.role;
      }

      console.log(`Вход выполнен: ${name} (${session.role})`);

      return res.status(200).json({ success: true, redirectUrl: "/dashboard" });
    }

    console.log("Неверное имя компании или ключ");
    return res.status(401).json({ error: "Неверное имя компании или ключ" });
  } catch (ex) {
    console.error("Ошибка при попытке входа: " + ex);
    return res.status(500).json({ error: "server error" });
  } finally {
    if (connection) connection.release();
  }
};

export const APIaddteacher = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { fullname, birthday, gender, contacts, description, color } = req.body;

  const session = req.session as any;
  const companyId = session.company_id;

  let connection: PoolConnection | undefined;

  try {
    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();

    console.log(fullname, birthday, gender, contacts, description, color);

    await connection.query(
      `INSERT INTO teachers 
        (avatar, fullname, birthday, company_id, gender, contacts, description, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["", fullname, birthday, companyId, gender, contacts, description, color],
    );

    await connection.commit();

    return res.status(200).json({ success: true, redirectUrl: "/teachers" });
  } catch (ex) {
    console.error("Ошибка при добавлении преподавателя:", ex);
    if (connection) await connection.rollback();

    return res
      .status(500)
      .json({ error: "Ошибка сервера при добавлении преподавателя" });
  } finally {
    if (connection) connection.release();
  }
};

export const APIDelTeacher = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  let connection: PoolConnection | undefined;

  try {
    const delId = req.params.id;
    console.log(`Удаление преподавателя с ID: ${delId}`);

    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();

    await connection.query("DELETE FROM teachers WHERE id = ?", [delId]);

    await connection.commit();

    return res.status(200).json({ success: true });
  } catch (ex) {
    console.error("Ошибка при удалении преподавателя:", ex);

    if (connection) await connection.rollback();

    return res.status(500).json({ error: "Ошибка сервера при удалении" });
  } finally {
    if (connection) connection.release();
  }
};
