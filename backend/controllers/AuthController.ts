import 'dotenv/config';
import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import bcrypt from "bcrypt";

export const APIsignup = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { company, fullname, email, contact, password } = req.body;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingCompany]: any = await connection.query(
      "SELECT id FROM company WHERE name = ?",
      [company],
    );

    if (existingCompany && existingCompany.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Компания с таким названием уже зарегистрирована",
      });
    }

    const role = "Директор";
    const rank = 1000;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [insertCompanyResult]: any = await connection.query(
      "INSERT INTO company (name) VALUES (?)",
      [company],
    );
    const company_id = insertCompanyResult.insertId;

    const [initDirectorResult]: any = await connection.query(
      "INSERT INTO users (company_id, full_name, role, users.rank, email, password_hash, contact) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [company_id, fullname, role, rank, email, passwordHash, contact],
    );
    const user_id = initDirectorResult.insertId;

    await connection.commit();

    req.session.company_id = company_id;
    req.session.user_id = user_id;
    req.session.user_role = role;
    req.session.fullname = fullname;
    req.session.email = email;
    req.session.rank = rank;
    req.session.company_name = company;

    return res.status(200).json({
      success: true,
      message: "company with director has been created"
    });
  } catch (ex: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Ошибка при регистрации:", ex);

    if (ex.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Пользователь с таким email уже существует" });
    }

    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
export const APIsignin = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { company, login, password } = req.body;

  try {
    const [companyRows]: any = await pool.query(
      "SELECT id, name FROM company WHERE name = ?",
      [company],
    );

    if (!companyRows || companyRows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const companyId = companyRows[0].id;

    const [userRows]: any = await pool.query(
      "SELECT id, role, full_name, email, users.rank, password_hash FROM users WHERE company_id = ? AND email = ?",
      [companyId, login],
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userRows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    req.session.company_id = companyId;
    req.session.company_name = companyRows[0].name;
    req.session.user_id = user.id;
    req.session.user_role = user.role;
    req.session.fullname = user.full_name;
    req.session.email = user.email;
    req.session.rank = user.rank;

    return res.status(200).json({
      success: true,
      message: "authorization was be completed",
    });
  } catch (ex: any) {
    console.error("Ошибка при авторизации:", ex);
    return res.status(500).json({
      success: false,
      error: "internal server error",
    });
  }
};
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка сессии:', err);
      return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Вышли!' });
  });
};
