import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const createLead = async (
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

    const { user_id, name, contact, source, description } = req.body;

    if (!name || !contact) {
      return res.status(400).json({
        success: false,
        message: "Поля 'name' и 'contact' обязательны для заполнения",
      });
    }

    const query = `
            INSERT INTO leads (company_id, user_id, name, contact, source, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'new')
        `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      company_id,
      user_id || null,
      name,
      contact,
      source || null,
      description || null,
    ]);

    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        company_id,
        user_id: user_id || null,
        name,
        contact,
        status: "new",
      },
    });
  } catch (er: any) {
    console.log(er);
    return res.status(500).json({
      success: false,
      message: er.message || er,
    });
  }
};

export const getLeads = async (
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

    const query = `SELECT * FROM leads WHERE company_id = ? ORDER BY created_at DESC`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [company_id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Лиды для данной компании не найдены",
      });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (er: any) {
    console.log(er);
    return res.status(500).json({
      success: false,
      message: er.message || er,
    });
  }
};

export const getLeadById = async (
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

    const { id } = req.params;
    const query = `SELECT * FROM leads WHERE id = ? AND company_id = ?`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id, company_id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Лид не найден" });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (er: any) {
    console.log(er);
    return res.status(500).json({
      success: false,
      message: er.message || er,
    });
  }
};

export const deleteLead = async (
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

    const { id } = req.params;
    const query = `DELETE FROM leads WHERE id = ? AND company_id = ?`;
    const [result] = await pool.query<ResultSetHeader>(query, [id, company_id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Лид не найден или уже удален" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Лид успешно удален" });
  } catch (er: any) {
    console.log(er);
    return res.status(500).json({
      success: false,
      message: er.message || er,
    });
  }
};

export const updateLead = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const connection = await pool.getConnection();

  try {
    const company_id = req.session?.company_id;
    if (!company_id) {
      connection.release();
      return res
        .status(401)
        .json({ success: false, message: "Сессия не найдена" });
    }

    const { id } = req.params;
    const {
      status,
      user_id,
      name,
      contact,
      source,
      loss_reason_id,
      description,
    } = req.body;

    // 1. Валидация входных данных для статуса "lost"
    if (status === "lost" && !loss_reason_id) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Поле 'loss_reason_id' обязательно при статусе 'lost'.",
      });
    }

    // 2. Проверка текущего статуса лида в БД перед изменениями (Бизнес-защита)
    const [currentLeadRows] = await connection.query<RowDataPacket[]>(
      `SELECT status FROM leads WHERE id = ? AND company_id = ?`,
      [id, company_id],
    );

    if (currentLeadRows.length === 0) {
      connection.release();
      return res
        .status(404)
        .json({ success: false, message: "Лид не найден" });
    }

    const currentStatus = currentLeadRows[0].status;

    // Если лид уже в финальной точке воронки, запрещаем менять статус на другой
    if (
      (currentStatus === "won" || currentStatus === "lost") && 
      status !== undefined && 
      status !== currentStatus
    ) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Ошибка: Нельзя изменить статус лида, так как он уже закрыт со статусом '${currentStatus}'.`,
      });
    }

    // Открываем транзакцию для атомарного обновления лида и создания клиента
    await connection.beginTransaction();

    // 3. Динамическая сборка SQL-запроса на обновление
    const fields: string[] = [];
    const values: any[] = [];

    if (user_id !== undefined) {
      fields.push("user_id = ?");
      values.push(user_id);
    }
    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (contact !== undefined) {
      fields.push("contact = ?");
      values.push(contact);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (source !== undefined) {
      fields.push("source = ?");
      values.push(source);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    // Логика управления полем причины отказа
    if (status !== undefined && status !== "lost") {
      fields.push("loss_reason_id = ?");
      values.push(null);
    } else if (loss_reason_id !== undefined) {
      fields.push("loss_reason_id = ?");
      values.push(loss_reason_id);
    }

    if (fields.length > 0) {
      const updateLeadQuery = `UPDATE leads SET ${fields.join(", ")} WHERE id = ? AND company_id = ?`;
      values.push(id, company_id);
      
      const [updateResult] = await connection.query<ResultSetHeader>(
        updateLeadQuery,
        values,
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Лид не найден или не принадлежит вашей компании" });
      }
    }

    // 4. Логика авто-конвертации лида в действующего клиента
    if (status === "won") {
      const [leadRows] = await connection.query<RowDataPacket[]>(
        `SELECT name, contact FROM leads WHERE id = ? AND company_id = ?`,
        [id, company_id],
      );

      const leadName = name || leadRows[0]?.name;
      const leadContact = contact || leadRows[0]?.contact;

      if (!leadName || !leadContact) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Не удалось получить имя или контакт лида для конвертации",
        });
      }

      // Проверка на дублирование клиента по контакту внутри компании
      const [existingClient] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM clients WHERE contact = ? AND company_id = ?`,
        [leadContact, company_id],
      );

      if (existingClient.length === 0) {
        const createClientQuery = `
            INSERT INTO clients (name, avatar, balance, skills, status, contact, company_id)
            VALUES (?, NULL, 0.00, 0, 1, ?, ?)
        `;

        await connection.query<ResultSetHeader>(createClientQuery, [
          leadName,
          leadContact,
          company_id,
        ]);
      }
    }

    // Подтверждаем все изменения в базе данных
    await connection.commit();
    return res.status(200).json({
      success: true,
      message:
        status === "won"
          ? "Лид успешно конвертирован в действующего клиента!"
          : "Данные лида успешно обновлены",
    });
  } catch (er: any) {
    await connection.rollback();
    console.log(er);
    return res.status(500).json({ success: false, message: er.message || er });
  } finally {
    connection.release();
  }
};

