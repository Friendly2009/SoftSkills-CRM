import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const APIGetClients = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const company_id = req.session.company_id;

    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [clients] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.id,
        c.name,
        c.balance,
        c.skills,
        c.status,
        c.contact,
        c.company_id,
        COALESCE(JSON_ARRAYAGG(g.id), JSON_ARRAY()) AS group_ids,
        COALESCE(JSON_ARRAYAGG(g.name), JSON_ARRAY()) AS group_names
      FROM clients c
      LEFT JOIN group_members gm ON c.id = gm.client_id
      LEFT JOIN \`groups\` g ON gm.group_id = g.id
      WHERE c.company_id = ?
      GROUP BY c.id`,
      [company_id],
    );

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (ex) {
    console.error("Ошибка при получении списка клиентов:", ex);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const addclient = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const { name, group_ids, balance, skills, status, contact } = req.body;

  try {
    const company_id = req.session.company_id;

    const targetGroupId =
      group_ids && group_ids.length > 0 ? group_ids[0] : null;

    const [clientResult] = await pool.query(
      `INSERT INTO clients (name, balance, skills, status, contact, company_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, balance, skills, status, contact, company_id],
    );

    const newClientId = (clientResult as ResultSetHeader).insertId;

    if (targetGroupId !== null) {
      await pool.query(
        `INSERT INTO group_members (group_id, client_id) VALUES (?, ?)`,
        [targetGroupId, newClientId],
      );
    }

    return res.status(200).json({
      success: true,
      message: "client was be added in database",
    });
  } catch (ex) {
    console.error(ex);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const delclient = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const clientId = parseInt(req.params.id[0]);

  if (isNaN(clientId)) {
    res.status(400).json({ error: "Некорректный ID клиента" });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(`DELETE FROM group_members WHERE client_id = ?`, [
      clientId,
    ]);

    const [result] = await connection.execute<ResultSetHeader>(
      `DELETE FROM clients WHERE id = ?`,
      [clientId],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      res.status(404).json({ error: "Клиент не найден" });
      return;
    }

    await connection.commit();

    res.status(200).json({ message: "Клиент успешно удален" });
  } catch (error) {
    await connection.rollback();
    console.error("Ошибка при удалении клиента:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  } finally {
    connection.release();
  }
};

export async function updateClient(req: Request, res: Response): Promise<void> {
  const clientId = parseInt(req.params.id[0]);

  if (isNaN(clientId)) {
    res.status(400).json({ error: "Некорректный ID клиента" });
    return;
  }

  const { name, balance, skills, status, contact, company_id, group_id } =
    req.body;

  const clientFields: Record<string, any> = {};
  if (name !== undefined) clientFields.name = name;
  if (balance !== undefined) clientFields.balance = balance;
  if (skills !== undefined) clientFields.skills = skills;
  if (status !== undefined) clientFields.status = status;
  if (contact !== undefined) clientFields.contact = contact;
  if (company_id !== undefined) clientFields.company_id = company_id;

  if (Object.keys(clientFields).length === 0 && group_id === undefined) {
    res.status(400).json({ error: "Нет данных для обновления" });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    let clientUpdated = false;

    if (Object.keys(clientFields).length > 0) {
      const keys = Object.keys(clientFields);
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      const values = keys.map((key) => clientFields[key]);

      values.push(clientId);

      const [clientResult] = await connection.execute<ResultSetHeader>(
        `UPDATE clients SET ${setClause} WHERE id = ?`,
        values,
      );

      if (clientResult.affectedRows > 0) {
        clientUpdated = true;
      }
    }

    if (group_id !== undefined) {
      const [existingRelation] = await connection.execute<any[]>(
        `SELECT * FROM group_members WHERE client_id = ?`,
        [clientId],
      );

      if (existingRelation.length > 0) {
        await connection.execute(
          `UPDATE group_members SET group_id = ? WHERE client_id = ?`,
          [group_id, clientId],
        );
      } else {
        await connection.execute(
          `INSERT INTO group_members (group_id, client_id) VALUES (?, ?)`,
          [group_id, clientId],
        );
      }
      clientUpdated = true;
    }

    if (!clientUpdated) {
      await connection.rollback();
      res
        .status(404)
        .json({ error: "Клиент не найден или данные не изменились" });
      return;
    }

    await connection.commit();
    res.status(200).json({ message: "Данные клиента успешно обновлены" });
  } catch (error) {
    await connection.rollback();
    console.error("Ошибка при обновлении клиента:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  } finally {
    connection.release();
  }
}
