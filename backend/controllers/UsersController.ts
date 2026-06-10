import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";

export const getUsers = async (req: Request, res: Response): Promise<Response | void> => {
  const {company_id} = req.body;
  let connection: PoolConnection | undefined;
  try{
    connection = await pool.getConnection();

    if (!connection) throw new Error("don't connect with database");

    const [users] = await connection.query('select * from users where company_id = ?', [company_id]);

    const rows = users as any[];

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch(ex) {
    return res.status(400).json({
      success: false,
      message: "Couldn't get list of users"
    })
  }
};

export const checkConnect = async (req: Request, res: Response) =>{
  try{
    let connection: PoolConnection | undefined;
    connection = await (pool as any).getConnection();
    if (!connection) throw new Error("Не удалось установить соединение с БД");
    return res.status(200).json({
      "connect with internet": "true",
      "connect with database": "true"
    });
  }catch(ex){
    return res.status(400).json({error: ex})
  }
}