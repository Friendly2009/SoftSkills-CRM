import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";
import bcrypt from "bcrypt";

export const APIsignup = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { company, fullname, email, contact, password } = req.body;
  let connection: any;

  try {
    connection = await (pool as any).getConnection();

    await connection.beginTransaction();

    const role = "Директор";
    const rank = 1000;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const [newCompany]: any = await connection.query(
      "INSERT INTO company (name) VALUES (?)",
      [company],
    );
    
    const companyRows = newCompany[0];
    const company_id = newCompany.insertId;
     
    const [initDirector]: any = await connection.query(
      "INSERT INTO users (company_id, full_name, role, users.rank, email, password_hash, contact) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [company_id, fullname, role, rank, email, passwordHash, contact],
    );

    const user = initDirector[0];
    await connection.commit();

    return res.status(200).json({
      success: true,
      data: {
        company: {
          company_id: company_id,
          company_name: companyRows[0]?.name,
        },
        user: {
          user_id: user.id,
          full_name: user.full_name,
          role: user.role,
          rank: user.rank,
          email: user.email,
          birthday: user.birthday,
          contact: user.contact,
          gender: user.gender,
          avatar: user.avatar,
        },
      },
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
  const { company, login, password } = req.body;
  let connection: PoolConnection | undefined;

  try {
    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("No Connect with database");

    //----------company----------//
    const [companyData] = await connection.query(
      "select * from company where name = ?",
      [company],
    );

    const companyRows = companyData as any[];

    if (companyRows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const companyId = companyRows[0]?.id;

    //----------users----------//
    const [userData] = await connection.query(
      "select * from users where company_id = ? and email = ?",
      [companyId, login],
    );

    const userRows = userData as any[];

    if (userRows.length === 0) {
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

    return res.status(200).json({
      success: true,
      data: {
        company: {
          company_id: companyRows[0]?.id,
          company_name: companyRows[0]?.name,
        },
        user: {
          user_id: user.id,
          full_name: user.full_name,
          role: user.role,
          rank: user.rank,
          email: user.email,
          birthday: user.birthday,
          contact: user.contact,
          gender: user.gender,
          avatar: user.avatar,
        },
      }
    });
  } catch (ex: any) {
    console.error(ex);
    return res.status(500).json({
      success: false,
      error: "internal server error",
    });
  } finally {
    if (connection) connection.release();
  }
};