import { Request, Response } from "express";
import pool from "../data_base_connect.js";

export const getglobalinfo = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT name FROM company WHERE id = ?",
      [req.session.company_id],
    ) as any[];

    const company = rows && rows.length > 0 ? rows[0] : { name: "Неизвестно" };

    return res.status(200).json({
      success: true,
      data: {
        companyName: company.name, 
        role: req.session.user_role,
        fullname: req.session.fullname,
        email: req.session.email,
        rank: req.session.rank,
      },
    });
  } catch (ex) {
    console.error("Ошибка в getglobalinfo:", ex);
    return res.status(500).json({ 
      success: false,
      message: "internal server error",
    });
  }
};

export const checkconnect = async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      "connect with internet": "true",
      "connect with database": "true",
    });
  } catch (ex) {
    console.error("Ошибка проверки соединения с БД:", ex);
    return res.status(500).json({
      success: false,
      message: "database connection failed",
    });
  }
};

export const getallsession = async (req: Request, res: Response) => {
  try {
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
  } catch (ex) {
    console.error("Ошибка в getallsession:", ex);
    return res.status(500).json({
      success: false,
      message: "oooops, something went wrong"
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = req.session.user_id;
  const companyId = req.session.company_id;

  if (!userId || !companyId) {
    return res.status(401).json({ success: false, message: "Не авторизован" });
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT id, full_name as fullname, role as user_role, \`rank\`, email, contact, gender, 
       birthday, avatar 
       FROM users 
       WHERE id = ? AND company_id = ?`,
      [userId, companyId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }

    const userData = rows[0];
    
    const birthdayDate = userData.birthday ? new Date(userData.birthday) : null;

    return res.status(200).json({
      success: true,
      user: {
        ...userData,
        birthday: birthdayDate,
        company_name: req.session.company_name
      }
    });

  } catch (error) {
    console.error("Ошибка при получении профиля:", error);
    return res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};
