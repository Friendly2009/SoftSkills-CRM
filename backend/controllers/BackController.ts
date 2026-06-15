import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";

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

export const getallsession = async (req: Request, res: Response) => {
  try{
    return res.status(200).json({
      success: true,
      session: {
        company_id: req.session.company_id,
        user_id: req.session.user_id,
        user_role: req.session.user_role,
        fullname: req.session.fullname,
        email: req.session.email,
        rank: req.session.rank,
        company_name: req.session.company_name
      }
    });
  } catch(ex){
    console.log(ex);
    return res.status(400).json({
      success: false,
      message: "oooops, something went wrong"
    });
  }
};