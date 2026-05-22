import { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import db from "/Users/S/StudioProjects/crm systen/alpha_crm_open_source/backend/data_base_connect.js";
import { PoolConnection } from "mysql2/promise";

export const index = (req: Request, res: Response): void => {
  res.status(200).json({ 
    message: "Добро пожаловать в API" 
  });
};

export const signup = (req: Request, res: Response): void => {
  res.status(200).json({ 
    page: "signup", 
    title: "Регистрация новой компании" 
  });
};

export const APIsignup = async (req: Request, res: Response): Promise<Response | void> => {
  const { fullName, email, phone, companyName, adminKey } = req.body;

  const userKey = crypto.randomBytes(4).toString("hex");
  let connection: PoolConnection | undefined;

  try {
    connection = await (db as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();    const [compResult]: any = await connection.query(
      `INSERT INTO company (name, access_key_admin, access_key_user) VALUES (?, ?, ?)`,
      [companyName, adminKey, userKey]
    );
    const companyId = compResult.insertId;

    const userDescription = `Phone: ${phone}, Email: ${email}`;
    const [userResult]: any = await connection.query(
      `INSERT INTO users (company_id, full_name, role, description) VALUES (?, ?, ?, ?)`,
      [companyId, fullName, "admin", userDescription]
    );
    const userId = userResult.insertId;

    const [[dbCompany]]: any = await connection.query(
      "SELECT * FROM company WHERE id = ?",
      [companyId]
    );
    const [[dbUser]]: any = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    await connection.commit();

    const session = req.session as any;
    
    session.company_id = dbCompany.id;
    session.company_name = dbCompany.name;
    session.key_admin = dbCompany.access_key_admin;
    session.key_user = dbCompany.access_key_user;

    session.user_id = dbUser.id;
    session.user_full_name = dbUser.full_name;
    session.role = dbUser.role;
    session.user_description = dbUser.description;

    console.log(`Администратор ${fullName} и компания ${companyName} успешно созданы`);
    
    return res.status(200).json({ success: true, redirectUrl: "/dashboard" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Ошибка при регистрации:", error);
    return res.status(500).json({ error: "Ошибка сервера при регистрации" });
  } finally {
    if (connection) connection.release();
  }
};

export const APIsignin = async (req: Request, res: Response): Promise<Response | void> => {
  const { company, login, password } = req.body;
  let connection: PoolConnection | undefined;

  try {
    connection = await (db as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    const [companies]: any = await connection.query(
      "SELECT * FROM company WHERE name = ? AND (access_key_admin = ? OR access_key_user = ?)",
      [company, key, key]
    );

    if (companies.length > 0) {
      const currentCompany = companies[0];
      const userRole = currentCompany.access_key_admin === key ? "admin" : "user";
      
      const session = req.session as any;
      session.role = userRole;

      session.company_id = currentCompany.id;
      session.company_name = currentCompany.name;
      session.key_admin = currentCompany.access_key_admin;
      session.key_user = currentCompany.access_key_user;

      const [users]: any = await connection.query(
        "SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1",
        [currentCompany.id, userRole]
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

export const APIaddteacher = async (req: Request, res: Response): Promise<Response | void> => {
  const { fullname, birthday, gender, contacts, description, color } = req.body;
  
  const session = req.session as any;
  const companyId = session.company_id;

  let connection: PoolConnection | undefined;

  try {
    connection = await (db as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();

    console.log(fullname, birthday, gender, contacts, description, color);

    await connection.query(
      `INSERT INTO teachers 
        (avatar, fullname, birthday, company_id, gender, contacts, description, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "",
        fullname,
        birthday,
        companyId,
        gender,
        contacts,
        description,
        color,
      ],
    );

    await connection.commit();
    
    return res.status(200).json({ success: true, redirectUrl: "/teachers" });

  } catch (ex) {
    console.error("Ошибка при добавлении преподавателя:", ex);
    if (connection) await connection.rollback();
    
    return res.status(500).json({ error: "Ошибка сервера при добавлении преподавателя" });
  } finally {
    if (connection) connection.release();
  }
};

export const APIDelTeacher = async (req: Request, res: Response): Promise<Response | void> => {
  let connection: PoolConnection | undefined;

  try {
    const delId = req.params.id;
    console.log(`Удаление преподавателя с ID: ${delId}`);

    connection = await (db as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");

    await connection.beginTransaction();

    await connection.query('DELETE FROM teachers WHERE id = ?', [delId]);

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