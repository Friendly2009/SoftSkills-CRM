import { ownedGroups, respondToAccessError } from "../security/ownership.js";
import { authorize } from "../middleware/auth.js";
import { Request, Response } from "express";
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const APIGetClients = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  if (!authorize(req, res, 500)) return;

  try {
    const company_id = req.session.company_id;

    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.session?.rank! < 500) {
      return res.status(403).json({ success: false, message: "not enough rights to perform the action" });
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
          JOIN \`groups\` vg ON vg.id = gs.group_id
          JOIN users vu ON vu.id = vg.users_id AND vu.company_id = c.company_id
          WHERE gm_sub.client_id = c.id
        ) AS next_visit

      FROM clients c
      LEFT JOIN group_members gm ON c.id = gm.client_id
      LEFT JOIN \`groups\` g ON gm.group_id = g.id AND EXISTS (SELECT 1 FROM users gu WHERE gu.id = g.users_id AND gu.company_id = c.company_id)
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
  if (!authorize(req, res, 500)) return;

  const { name, group_ids, balance, skills, status, contact } = req.body;

  const company_id = req.session.company_id;
  if (!company_id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (req.session?.rank! < 500) {
    return res.status(403).json({ success: false, message: "not enough rights to perform the action" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ownedGroups(connection, group_ids, company_id);

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
    if (respondToAccessError(ex, res)) return;
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
  if (!authorize(req, res, 1000)) return;

  const company_id = req.session.company_id!;
  const clientId = Number(req.params.id);

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    res.status(400).json({ error: "Некорректный ID клиента" });
    return;
  }
  if (req.session?.rank! < 1000) {
    return res.status(403).json({ success: false, message: "not enough rights to perform the action" });
  }
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute<ResultSetHeader>(
      `DELETE FROM clients WHERE id = ? AND company_id = ?`,
      [clientId, company_id],
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

export async function updateClient(req: Request, res: Response) {
  if (!authorize(req, res, 500)) return;
  const company_id = req.session.company_id!;
  const clientId = Number(req.params.id);

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    res.status(400).json({ error: "Некорректный ID клиента" });
    return;
  }

  const { name, balance, skills, status, contact, group_ids } =
    req.body;

  const targetBalance = balance !== undefined ? Number(balance) : undefined;
  if (targetBalance !== undefined && (!Number.isFinite(targetBalance) || Math.round(targetBalance * 100) !== targetBalance * 100)) {
    return res.status(400).json({ success: false, message: "Balance must be a valid amount with at most two decimal places" });
  }

  const clientFields: Record<string, any> = {};
  if (name !== undefined) clientFields.name = name;
  if (targetBalance !== undefined) clientFields.balance = targetBalance;
  if (skills !== undefined) clientFields.skills = skills;
  if (status !== undefined) clientFields.status = status;
  if (contact !== undefined) clientFields.contact = contact;
  if (req.body.company_id !== undefined && Number(req.body.company_id) !== company_id) {
    return res.status(403).json({ error: "Company reassignment is forbidden" });
  }

  if (Object.keys(clientFields).length === 0 && group_ids === undefined) {
    res.status(400).json({ error: "Нет данных для обновления" });
    return;
  }
  if (req.session?.rank! < 500) {
    return res.status(403).json({ success: false, message: "not enough rights to perform the action" });
  }
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [clientRows]: any = await connection.execute(
      `SELECT name, balance, company_id FROM clients WHERE id = ? AND company_id = ? FOR UPDATE`,
      [clientId, company_id],
    );

    if (!clientRows || clientRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: "Клиент не найден" });
      return;
    }

    await ownedGroups(connection, group_ids, company_id);

    const oldAmountNum = Number(clientRows[0].balance);
    const clientName = clientRows[0].name;
    const clientCompanyId = company_id;

    if (Object.keys(clientFields).length > 0) {
      const keys = Object.keys(clientFields);
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      const values = keys.map((key) => clientFields[key]);

      values.push(clientId, company_id);

      await connection.execute(
        `UPDATE clients SET ${setClause} WHERE id = ? AND company_id = ?`,
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
    if (respondToAccessError(error, res)) return;
    console.error("Ошибка при обновлении клиента:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  } finally {
    connection.release();
  }
}


export const topUpClient = async (req: Request, res: Response): Promise<Response | void> => {
  if (!authorize(req, res, 500)) return;
  const companyId = req.session.company_id!;
  const clientId = Number(req.params.id);
  const amount = Number(req.body?.amount);
  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid client ID" });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000 || Math.round(amount * 100) !== amount * 100) {
    return res.status(400).json({ success: false, message: "Amount must be positive and have at most two decimal places" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id, name, balance FROM clients WHERE id = ? AND company_id = ? FOR UPDATE",
      [clientId, companyId],
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const [update] = await connection.execute<ResultSetHeader>(
      "UPDATE clients SET balance = balance + ? WHERE id = ? AND company_id = ?",
      [amount, clientId, companyId],
    );
    if (update.affectedRows !== 1) throw new Error("Client balance update failed");
    const [transaction] = await connection.execute<ResultSetHeader>(
      "INSERT INTO financial_transactions (company_id, lesson_id, client_id, user_id, amount, type, description) VALUES (?, NULL, ?, ?, ?, 'wallet_topup', ?)",
      [companyId, clientId, req.session.user_id!, amount, `Пополнение счёта клиента ${rows[0].name} (${clientId})`],
    );
    await connection.commit();
    return res.status(200).json({ success: true, data: { clientId, amount, balance: Number(rows[0].balance) + amount, transactionId: transaction.insertId } });
  } catch (error) {
    await connection.rollback();
    console.error("Ошибка пополнения счёта клиента:", error);
    return res.status(500).json({ success: false, message: "Не удалось пополнить счёт клиента" });
  } finally {
    connection.release();
  }
};
