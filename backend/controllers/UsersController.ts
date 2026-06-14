import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";
import bcrypt from "bcrypt";

export const getusers = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();

    if (!connection) throw new Error("don't connect with database");

    const [users] = await connection.query(
      "select * from users where company_id = ?",
      [req.session.company_id],
    );

    const rows = users as any[];

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (ex) {
    console.error(ex);
    return res.status(400).json({
      success: false,
      message: "Couldn't get list of users",
    });
  }
};

export const getglobalinfo = async (req: Request, res: Response) => {
  try {
    let connection: PoolConnection | undefined;

    connection = await pool.getConnection();
    if (!connection) throw new Error("do not connected with database");

    const companyName = (await connection.query(
      "select name from company where id = ?",
      [req.session.company_id],
    )) as any[];

    return res.status(200).json({
      success: true,
      data: {
        companyName: companyName[0],
        role: req.session.user_role,
        fullname: req.session.fullname,
        email: req.session.email,
        rank: req.session.rank,
      },
    });
  } catch (ex) {
    console.error(ex);
    return res.status(400).json({
      success: false,
      message: "internal server error",
    });
  }
};
export const checkconnect = async (req: Request, res: Response) => {
  try {
    let connection: PoolConnection | undefined;
    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");
    return res.status(200).json({
      "connect with internet": "true",
      "connect with database": "true",
    });
  } catch (ex) {
    console.error(ex);
    return res.status(400).json({
      success: false,
      message: "internal server error",
    });
  }
};
export const adduser = async (req: Request, res: Response) => {
  const { full_name, role, rank, email, contact, birthday, gender, password } = req.body;
  let connection: PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
    if (!connection) throw new Error("do not connected with database");

    await connection.beginTransaction();

    const company_id = req.session.company_id;

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await connection.query(
      "INSERT INTO users (company_id, full_name, role, `rank`, email, password_hash, birthday, contact, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [company_id, full_name, role, rank, email, password_hash, birthday || null, contact || null, gender || null]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      data: {
        company_id: company_id,
        full_name: full_name,
        role: role,
        rank: rank,
        email: email,
        contact: contact,
        birthday: birthday,
        gender: gender,
        password_hash: password_hash,
      },
    });
  } catch (ex: any) {
    console.error(ex);

    if (connection) {
      await connection.rollback();
    }

    return res.status(400).json({
      success: false,
      message: "oooops, something went wrong",
      error: ex.message
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

