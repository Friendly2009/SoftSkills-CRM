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
        GROUP_CONCAT(DISTINCT g.id) AS group_ids_str,
        GROUP_CONCAT(DISTINCT g.name SEPARATOR '|||') AS group_names_str,
        
        -- Убрали DATE_FORMAT, чтобы MIN() возвращал чистый тип DATE бд
        (
          SELECT MIN(
            CASE gs.day_of_week
              WHEN 'Понедельник' THEN DATE_ADD(CURRENT_DATE(), INTERVAL (8 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Вторник'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (9 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Среда'       THEN DATE_ADD(CURRENT_DATE(), INTERVAL (10 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Четверг'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (11 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Пятница'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (12 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Суббота'     THEN DATE_ADD(CURRENT_DATE(), INTERVAL (13 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
              WHEN 'Воскресенье' THEN DATE_ADD(CURRENT_DATE(), INTERVAL (14 - DAYOFWEEK(CURRENT_DATE())) % 7 DAY)
            END
          )
          FROM group_members gm_sub
          JOIN group_schedules gs ON gm_sub.group_id = gs.group_id
          WHERE gm_sub.client_id = c.id
        ) AS next_visit

      FROM clients c
      LEFT JOIN group_members gm ON c.id = gm.client_id
      LEFT JOIN \`groups\` g ON gm.group_id = g.id
      WHERE c.company_id = ?
      GROUP BY c.id`,
      [company_id],
    );

    const formattedClients = clients.map((client) => {
      const group_ids = client.group_ids_str
        ? client.group_ids_str.split(",").map(Number)
        : [];

      const group_names = client.group_names_str
        ? client.group_names_str.split("|||")
        : [];

      const { group_ids_str, group_names_str, ...cleanClient } = client;

      const nextVisitDate = client.next_visit
        ? new Date(client.next_visit)
        : null;

      return {
        ...cleanClient,
        group_ids,
        group_names,
        next_visit: nextVisitDate,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedClients,
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

  const company_id = req.session.company_id;
  if (!company_id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [clientResult] = await connection.query(
      `INSERT INTO clients (name, balance, skills, status, contact, company_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, balance, skills, status, contact, company_id],
    );

    const newClientId = (clientResult as ResultSetHeader).insertId;

    if (Array.isArray(group_ids) && group_ids.length > 0) {
      const values = group_ids.map((groupId: number) => [groupId, newClientId]);

      await connection.query(
        `INSERT INTO group_members (group_id, client_id) VALUES ?`,
        [values],
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Client was successfully added to the database",
    });
  } catch (ex) {
    await connection.rollback();
    console.error("Ошибка при добавлении клиента:", ex);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    connection.release();
  }
};

export const delclient = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  const clientId = parseInt(req.params.id as string, 10);

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
  const clientId = parseInt(req.params.id as string, 10);

  if (isNaN(clientId)) {
    res.status(400).json({ error: "Некорректный ID клиента" });
    return;
  }

  const { name, balance, skills, status, contact, company_id, group_ids } =
    req.body;

  const targetBalance =
    balance !== undefined ? parseInt(String(balance), 10) : undefined;

  const clientFields: Record<string, any> = {};
  if (name !== undefined) clientFields.name = name;
  if (targetBalance !== undefined) clientFields.balance = targetBalance;
  if (skills !== undefined) clientFields.skills = skills;
  if (status !== undefined) clientFields.status = status;
  if (contact !== undefined) clientFields.contact = contact;
  if (company_id !== undefined) clientFields.company_id = company_id;

  if (Object.keys(clientFields).length === 0 && group_ids === undefined) {
    res.status(400).json({ error: "Нет данных для обновления" });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [clientRows]: any = await connection.execute(
      `SELECT name, balance, company_id FROM clients WHERE id = ?`,
      [clientId],
    );

    if (!clientRows || clientRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: "Клиент не найден" });
      return;
    }

    const oldAmountNum = Number(clientRows[0].balance);
    const clientName = clientRows[0].name;
    const clientCompanyId =
      company_id !== undefined ? company_id : clientRows[0].company_id;

    if (Object.keys(clientFields).length > 0) {
      const keys = Object.keys(clientFields);
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      const values = keys.map((key) => clientFields[key]);

      values.push(clientId);

      await connection.execute(
        `UPDATE clients SET ${setClause} WHERE id = ?`,
        values,
      );

      if (targetBalance !== undefined) {
        const diffAmount = targetBalance - oldAmountNum;

        if (diffAmount !== 0) {
          const txType = diffAmount > 0 ? "wallet_topup" : "correction";
          const txDescription =
            diffAmount > 0
              ? `Пополнение счета через личный кабинет (Клиент: ${clientName}, ID: ${clientId})`
              : `Ручная корректировка/списание баланса (Клиент: ${clientName}, ID: ${clientId})`;

          await connection.execute(
            `INSERT INTO financial_transactions 
                (company_id, lesson_id, client_id, user_id, amount, type, description) 
             VALUES (?, NULL, ?, NULL, ?, ?, ?)`,
            [
              clientCompanyId,
              clientId,
              Math.abs(diffAmount), 
              txType,
              txDescription,
            ],
          );
        }
      }
    }

    if (group_ids !== undefined) {
      await connection.execute(
        `DELETE FROM group_members WHERE client_id = ?`,
        [clientId],
      );

      if (Array.isArray(group_ids) && group_ids.length > 0) {
        const values = group_ids.map((groupId: number) => [groupId, clientId]);

        await connection.query(
          `INSERT INTO group_members (group_id, client_id) VALUES ?`,
          [values],
        );
      }
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
