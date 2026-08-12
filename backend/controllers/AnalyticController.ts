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

export const getFinancialTimeline = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || company_id === -1) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [debtRows]: any = await pool.query(
      `SELECT COALESCE(SUM(ABS(balance)), 0) AS total_client_debt 
       FROM clients 
       WHERE company_id = ? AND balance < 0`,
      [company_id],
    );
    const currentDebt = Number(debtRows[0]?.total_client_debt || 0);

    const [rows]: any = await pool.query(
      `SELECT 
        CASE DATE_FORMAT(created_at, '%c')
          WHEN 1 THEN 'Янв' WHEN 2 THEN 'Фев' WHEN 3 THEN 'Март' WHEN 4 THEN 'Апр'
          WHEN 5 THEN 'Май' WHEN 6 THEN 'Июнь' WHEN 7 THEN 'Июль' WHEN 8 THEN 'Авг'
          WHEN 9 THEN 'Сент' WHEN 10 THEN 'Окт' WHEN 11 THEN 'Ноя' WHEN 12 THEN 'Дек'
        END AS period,
        DATE_FORMAT(created_at, '%Y-%m') AS raw_month,
        COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS profit
       FROM financial_transactions
       WHERE company_id = ?
       GROUP BY raw_month, period
       ORDER BY raw_month ASC
       LIMIT 6`,
      [company_id],
    );

    const timelineData = rows.map((row: any) => ({
      period: row.period,
      revenue: Number(row.revenue),
      expenses: Number(row.expenses),
      profit: Number(row.profit),
      debts: currentDebt,
    }));

    return res.status(200).json({
      success: true,
      data: timelineData,
    });
  } catch (error) {
    console.error("Ошибка в getFinancialTimeline:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getExpensesStructure = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || isNaN(company_id)) {
      return res.status(401).json({ success: false, message: "User is not authorized" });
    }

    const [rows]: any = await pool.query(
      `SELECT 
        CASE 
          WHEN type = 'expense' AND (lesson_id IS NOT NULL OR description LIKE 'Категория: [ФОТ]%') THEN 'ФОТ Преподавателей'
          WHEN type = 'expense' AND description LIKE 'Категория: [АРЕНДА]%' THEN 'Аренда помещений'
          WHEN type = 'expense' AND description LIKE 'Категория: [МАРКЕТИНГ]%' THEN 'Маркетинг и реклама'
          WHEN type = 'expense' AND description LIKE 'Категория: [ХОЗЯЙСТВЕННЫЕ]%' THEN 'Хозяйственные расходы'
          WHEN type = 'correction' THEN 'Ручные корректировки баланса'
          ELSE 'Прочие расходы'
        END AS name,
        COALESCE(SUM(amount), 0) AS value
       FROM financial_transactions
       WHERE company_id = ? AND type IN ('expense', 'correction')
       GROUP BY name`,
      [company_id]
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Ошибка в getExpensesStructure:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
