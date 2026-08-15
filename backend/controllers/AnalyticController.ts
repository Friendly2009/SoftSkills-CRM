import "dotenv/config";
import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { Query, QueryResult, RowDataPacket } from "mysql2";

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
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
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
      [company_id],
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Ошибка в getExpensesStructure:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getClientDebtors = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || isNaN(company_id)) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const [rows]: any = await pool.query(
      `SELECT 
    c.id,
    c.name,
    c.balance AS debt,
    c.contact,
    COALESCE(GROUP_CONCAT(g.name SEPARATOR ', '), 'Без группы') AS group_names
FROM cheapcrm.clients c
LEFT JOIN cheapcrm.group_members gm ON c.id = gm.client_id
LEFT JOIN cheapcrm.\`groups\` g ON gm.group_id = g.id
WHERE c.company_id = ? AND c.balance < 0
GROUP BY c.id, c.name, c.balance, c.contact
ORDER BY c.balance ASC;
`,
      [company_id],
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Ошибка в getClientDebtors:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllState = async (req: Request, res: Response) => {
  try {
    const company_id = req.session?.company_id;

    const parsedCompanyId = parseInt(String(company_id), 10);
    if (!company_id || isNaN(parsedCompanyId)) {
      return res
        .status(401)
        .json({ success: false, message: "user is unauthorized" });
    }
    const [[financeRows], [debtRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT 
      COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) AS revenue,
      COALESCE(SUM(CASE WHEN type IN ('expense', 'correction') THEN amount ELSE 0 END), 0) AS expense
    FROM financial_transactions
    WHERE company_id = ?`,
        [parsedCompanyId],
      ),
      pool.query<RowDataPacket[]>(
        `SELECT 
      ABS(COALESCE(SUM(balance), 0)) AS debt
    FROM clients
    WHERE company_id = ? AND balance < 0`,
        [parsedCompanyId],
      ),
    ]);

    const financeData = financeRows[0] || {};
    const debtData = debtRows[0] || {};

    const revenue = Number(financeData.revenue || 0);
    const expense = Number(financeData.expense || 0);
    const debt = Number(debtData.debt || 0);

    const profit = revenue - expense;

    return res.status(200).json({
      success: true,
      revenue,
      debt,
      expense,
      profit,
    });
  } catch (error: any) {
    console.error("Error in getAllState:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getChartState = async (req: Request, res: Response) => {
  try {
    const companyId =
      parseInt(req.query.companyId as string, 10) || req.session?.company_id;

    if (!companyId || isNaN(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing company ID" });
    }

    const [financeRows]: any = await pool.query(
      `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month_key,
        CASE DATE_FORMAT(created_at, '%c')
          WHEN 1 THEN 'Янв' WHEN 2 THEN 'Фев' WHEN 3 THEN 'Мар'
          WHEN 4 THEN 'Апр' WHEN 5 THEN 'Май' WHEN 6 THEN 'Июн'
          WHEN 7 THEN 'Июл' WHEN 8 THEN 'Авг' WHEN 9 THEN 'Сен'
          WHEN 10 THEN 'Окт' WHEN 11 THEN 'Ноя' WHEN 12 THEN 'Дек'
        END AS period,
        COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN type IN ('expense', 'correction') THEN amount ELSE 0 END), 0) AS expenses
      FROM financial_transactions
      WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month_key, period
      ORDER BY month_key ASC
    `,
      [companyId],
    );

    const [debtRows]: any = await pool.query(
      `
      SELECT ABS(COALESCE(SUM(balance), 0)) AS current_debt
      FROM clients
      WHERE company_id = ? AND balance < 0
    `,
      [companyId],
    );

    const totalDebt = Number(debtRows[0]?.current_debt || 0);

    const formattedData = financeRows.map((row: any, index: number) => {
      const revenue = Number(row.revenue);
      const expenses = Number(row.expenses);

      return {
        period: row.period,
        revenue: revenue,
        expenses: expenses,
        profit: revenue - expenses,
        debts:
          index === financeRows.length - 1
            ? totalDebt
            : Math.round(totalDebt * (0.8 + index * 0.05)),
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error: any) {
    console.error("Error in getChartState:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getTeachersWorkload = async (req: Request, res: Response) => {
  try {
    const company_id = req.session?.company_id;
    const parsedCompanyId = parseInt(String(company_id), 10);

    if (!company_id || isNaN(parsedCompanyId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id AS teacher_id,
        u.full_name AS teacher_name,
        COALESCE(
          SUM(TIME_TO_SEC(TIMEDIFF(gs.end_time, gs.start_time)) / 3600), 
          0
        ) AS weekly_hours
      FROM users u
      JOIN \`groups\` g ON g.users_id = u.id
      JOIN group_schedules gs ON gs.group_id = g.id
      WHERE u.company_id = ? AND g.status IN (1, 2)
      GROUP BY u.id, u.full_name
      ORDER BY weekly_hours DESC
    `, [parsedCompanyId]);

    const formattedData = rows.map(row => ({
      teacherId: row.teacher_id,
      name: row.teacher_name,
      hours: parseFloat(Number(row.weekly_hours).toFixed(1))
    }));

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error: any) {
    console.error("Error in getTeachersWorkload:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  try {
    const company_id = req.session?.company_id;
    const parsedCompanyId = parseInt(String(company_id), 10);
    const range = (req.query.range as string) || 'month';

    if (!company_id || isNaN(parsedCompanyId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let interval = '1 MONTH';
    let dateFormat = '%d.%m'; 

    if (range === 'week') {
      interval = '7 DAY';
    } else if (range === 'quarter') {
      interval = '3 MONTH';
      dateFormat = 'Неделя %v'; 
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(l.lesson_date, ?) AS period_label,
        l.lesson_date AS raw_date,
        COUNT(la.client_id) AS total_scheduled,
        SUM(CASE WHEN la.attendance_status = 1 THEN 1 ELSE 0 END) AS total_attended
      FROM lessons l
      JOIN lesson_attendance la ON la.lesson_id = l.id
      WHERE l.status = 2 
        AND l.lesson_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${interval})
        AND l.id IN (SELECT id FROM lessons WHERE group_id IN (SELECT id FROM \`groups\` WHERE users_id IN (SELECT id FROM users WHERE company_id = ?)))
      GROUP BY period_label, raw_date
      ORDER BY raw_date ASC
    `, [dateFormat, parsedCompanyId]);

    const formattedData = rows.map(row => {
      const total = Number(row.total_scheduled);
      const attended = Number(row.total_attended);
      const rate = total > 0 ? Math.round((attended / total) * 100) : 100;

      return {
        period: row.period_label,
        rate: rate
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error: any) {
    console.error("Error in getAttendanceTrends:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
