import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import pool from "../data_base_connect.js";

export const APIGetClients = async (req: Request, res: Response): Promise<Response | void> =>{
    
    let connection: PoolConnection | undefined;
    try{
        connection = await pool.getConnection();
        if (!connection) throw new Error("No connect with database");

        const company_id = req.session.company_id;

        const [clients] = await connection.query("select * from clients where company_id = ?", [company_id]);
        const rowClients = clients as [];
        return res.status(200).json({
            success: true,
            data: rowClients
        })
    } catch(ex){
        console.error(ex);
        return res.status(400).json({
            success: false,
            message: "in server be finded some error"
        })
    }
};