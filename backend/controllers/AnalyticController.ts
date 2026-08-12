import "dotenv/config";
import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const get_accupancy_groups = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const company_id = req.session?.company_id;
    if (!company_id) {
      return res
        .status(401)
        .json({ success: false, message: "Сессия не найдена или истекла" });
    }
    const [rows]: any = await pool.query(
      `SELECT group_id, group_name, group_status, max_capacity, teacher_name, current_students, occupancy_rate 
             FROM accupancy_rate 
             WHERE company_id = ?`,
      [company_id],
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Компания не найдена" });
    }
    return res.status(200).json({ success: true, data: rows });
  } catch (er) {
    console.log(er);
    return res.status(500).json({
      success: false,
      message: er,
    });
  }
};

export const get_transactions_list = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const company_id = req.session.company_id;
    if (!company_id) {
      return res
        .status(401)
        .json({ success: false, message: "Сессия не найдена или истекла" });
    }
    const [rows]: any = await pool.query(
      `SELECT 
    ft.id, 
    ft.company_id, 
    ft.lesson_id, 
    ft.client_id, 
    c.name AS client_name,
    ft.user_id, 
    u.full_name AS user_name,   
    ft.amount, 
    ft.type, 
    ft.description, 
    ft.created_at
FROM financial_transactions ft
LEFT JOIN clients c ON c.id = ft.client_id
LEFT JOIN users u ON u.id = ft.user_id
WHERE ft.type != 'revenue' and ft.company_id = ?`,
      [company_id],
    );
    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "data nor found" });
    }
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error,
    });
  }
};

export const getRevenueSources = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || company_id === -1) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [rows]: any = await pool.query(
      `SELECT 
    CASE 
        WHEN g.name IS NOT NULL THEN CONCAT('Группа ', g.name) 
        ELSE 'Индивидуальные занятия' 
    END AS name,
    COALESCE(SUM(ft.amount), 0) AS value
FROM financial_transactions ft
LEFT JOIN lessons l ON ft.lesson_id = l.id
LEFT JOIN \`groups\` g ON l.group_id = g.id  
WHERE ft.company_id = ? AND ft.type = 'revenue'
GROUP BY g.id, g.name`,
      [company_id],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Ошибка в getRevenueSources:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
