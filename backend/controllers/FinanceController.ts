import "dotenv/config";
import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const addManualExpense = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || company_id === -1) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { amount, category, comment } = req.body;

    if (!amount || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Заполните сумму и категорию" });
    }

    const validCategories: Record<string, string> = {
      "Аренда помещений": "АРЕНДА",
      "Маркетинг и реклама": "МАРКЕТИНГ",
      "Канцелярия и материалы": "ХОЗЯЙСТВЕННЫЕ",
      "Хозяйственные расходы": "ХОЗЯЙСТВЕННЫЕ",
      "ФОТ Преподавателей (Вручную)": "ФОТ",
    };

    const systemTag = validCategories[category] || "ПРОЧЕЕ";
    const cleanComment = comment
      ? String(comment).trim().substring(0, 100)
      : "Без комментария";

    const finalDescription = `Категория: [${systemTag}] | Примечание: ${cleanComment}`;

    await pool.query(
      `INSERT INTO financial_transactions 
        (company_id, lesson_id, client_id, user_id, amount, type, description) 
       VALUES (?, NULL, NULL, NULL, ?, 'expense', ?)`,
      [company_id, Number(amount), finalDescription],
    );

    return res.status(200).json({
      success: true,
      message: "Расход успешно зафиксирован в кассе",
    });
  } catch (error) {
    console.error("Ошибка в addManualExpense:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const company_id = req.session.company_id;
    if (!company_id || isNaN(company_id)) {
      return res
        .status(401)
        .json({ success: false, message: "user is not authorized" });
    }
    if (req.session.rank! < 500) {
      return res.status(403).json({ success: false, message: "not enough rights to perform the action" });
    }
    const [rows] = await pool.query(
      `SELECT 
    id AS transaction_id,
    DATE_FORMAT(created_at, '%d.%m.%Y %H:%i') AS date,
    amount AS expense_amount,
    description AS operation_description,
    
    lesson_id,
    user_id AS teacher_id
FROM 
    cheapcrm.financial_transactions
WHERE 
    company_id = ?   
    AND type = 'expense' 
ORDER BY 
    created_at DESC`,
      [company_id],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "something went wrong and the data was be not delevery",
    });
  }
};
