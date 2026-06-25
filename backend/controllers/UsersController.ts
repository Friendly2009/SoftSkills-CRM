import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import bcrypt from "bcrypt";

export const getusers = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const [users] = await pool.query(
      "SELECT * FROM users WHERE company_id = ?",
      [req.session.company_id],
    );

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (ex) {
    console.error("Ошибка при получении пользователей:", ex);
    return res.status(500).json({
      success: false,
      message: "Couldn't get list of users",
    });
  }
};

export const adduser = async (req: Request, res: Response) => {
  const { full_name, role, rank, email, contact, birthday, gender, password } = req.body;

  try {
    const company_id = req.session.company_id;
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO users (company_id, full_name, role, `rank`, email, password_hash, birthday, contact, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [company_id, full_name, role, rank, email, password_hash, birthday || null, contact || null, gender || null]
    );

    return res.status(200).json({
      success: true,
      data: {
        company_id,
        full_name,
        role,
        rank,
        email,
        contact,
        birthday,
        gender,
        password_hash,
      },
    });
  } catch (ex: any) {
    console.error("Ошибка добавления пользователя:", ex);
    return res.status(500).json({
      success: false,
      message: "oooops, something went wrong",
    });
  }
};

export const deluser = async (req: Request, res: Response) => {
  const { id } = req.params; 
  const company_id = req.session.company_id;
  let connection;

  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows]: any = await connection.query(
      "SELECT id, `rank` FROM users WHERE id = ? AND company_id = ?",
      [id, company_id]
    );

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "User not found or access denied" });
    }
    
    if (rows[0].rank === 1000) {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        message: "you cannot delete user whose rank is 1000" 
      });
    }

    await connection.query(
      "UPDATE `groups` SET users_id = NULL WHERE users_id = ?",
      [id]
    );

    await connection.query(
      "DELETE FROM users WHERE id = ? AND company_id = ?",
      [id, company_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: { id }
    });

  } catch (ex: any) {
    if (connection) await connection.rollback();
    console.error("Ошибка при удалении пользователя:", ex);
    return res.status(500).json({
      success: false,
      message: "Ooops, something went wrong",
    });
  } finally {
    if (connection) connection.release(); 
  }
};

export const resetuser = async (req: Request, res: Response) => {
  const { id, full_name, role, rank, email, contact, birthday, gender, password } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID пользователя не указан" });
  }

  try {
    const [currentUsers]: any = await pool.query(
      'SELECT password_hash, DATE_FORMAT(birthday, "%Y-%m-%d") as birthday, gender FROM users WHERE id = ?', 
      [id]
    );
    
    if (!currentUsers || currentUsers.length === 0) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }

    const currentUser = currentUsers[0]; 

    let finalBirthday = (birthday && birthday.trim() !== '') ? birthday : currentUser.birthday;
    if (finalBirthday && typeof finalBirthday === 'string' && finalBirthday.includes('T')) {
      finalBirthday = finalBirthday.split('T')[0];
    }
    
    const finalGender = (gender && gender.trim() !== '') ? gender : currentUser.gender;
    
    let finalPasswordHash = currentUser.password_hash;
    if (password && password.trim() !== '') {
      finalPasswordHash = await bcrypt.hash(password, 10);
    }

    const sql = `UPDATE users SET full_name = ?, role = ?, \`rank\` = ?, email = ?, contact = ?, birthday = ?, gender = ?, password_hash = ? WHERE id = ?`;
    const queryParams = [full_name, role, rank, email, contact, finalBirthday, finalGender, finalPasswordHash, id];

    await pool.query(sql, queryParams);

    return res.status(200).json({
      success: true,
      message: "Данные сотрудника успешно обновлены"
    });

  } catch (ex) {
    console.error("Ошибка при обновлении пользователя:", ex);
    return res.status(500).json({
      success: false,
      message: "Произошла ошибка на сервере"
    });
  }
};
