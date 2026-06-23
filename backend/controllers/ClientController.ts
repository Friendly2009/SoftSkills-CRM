import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const APIGetClients = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const company_id = req.session.company_id;

    const [clients] = await pool.query(
      "SELECT * FROM clients WHERE company_id = ?", 
      [company_id]
    );

    return res.status(200).json({
      success: true,
      data: clients
    });
  } catch (ex) {
    console.error("Ошибка при получении списка клиентов:", ex);
    return res.status(500).json({
      success: false,
      message: "internal server error"
    });
  }
};
