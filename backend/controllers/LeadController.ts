import { Request, Response } from 'express';
import pool from "../data_base_connect.js";
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const create_lead = async (
    req: Request,
    res: Response
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
            return res
                .status(400)
                .json({ success: false, message: "Поля 'name' и 'contact' обязательны для заполнения" });
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
            description || null
        ]);
        
        return res.status(201).json({ 
            success: true,
            data: {
                id: result.insertId, 
                company_id, 
                user_id: user_id || null, 
                name, 
                contact, 
                status: 'new' 
            }
        });
    } catch (er: any) {
        console.log(er);
        return res.status(500).json({
            success: false,
            message: er.message || er
        });
    }
};

export const get_leads = async (
    req: Request,
    res: Response
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
            return res
                .status(404)
                .json({ success: false, message: "Лиды для данной компании не найдены" });
        }

        return res.status(200).json({ success: true, data: rows });
    } catch (er: any) {
        console.log(er);
        return res.status(500).json({
            success: false,
            message: er.message || er
        });
    }
};

export const get_lead_by_id = async (
    req: Request,
    res: Response
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
            return res
                .status(404)
                .json({ success: false, message: "Лид не найден" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (er: any) {
        console.log(er);
        return res.status(500).json({
            success: false,
            message: er.message || er
        });
    }
};

export const update_lead = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    try {
        const company_id = req.session?.company_id;
        if (!company_id) {
            return res
                .status(401)
                .json({ success: false, message: "Сессия не найдена или истекла" });
        }

        const { id } = req.params;
        const { user_id, name, contact, status, source, loss_reason_id, description } = req.body;

        if (status === 'lost' && !loss_reason_id) {
            return res.status(400).json({ 
                success: false,
                message: "Ошибка валидации: Поле 'loss_reason_id' строго обязательно, если статус равен 'lost'." 
            });
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (user_id !== undefined) { fields.push('user_id = ?'); values.push(user_id); }
        if (name !== undefined) { fields.push('name = ?'); values.push(name); }
        if (contact !== undefined) { fields.push('contact = ?'); values.push(contact); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (source !== undefined) { fields.push('source = ?'); values.push(source); }
        if (loss_reason_id !== undefined) { fields.push('loss_reason_id = ?'); values.push(loss_reason_id); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: "Нет данных для обновления" });
        }

        const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`;
        values.push(id, company_id);

        const [result] = await pool.query<ResultSetHeader>(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Лид не найден или не принадлежит вашей компании" });
        }

        return res.status(200).json({ success: true, message: "Данные лида успешно обновлены" });
    } catch (er: any) {
        console.log(er);
        return res.status(500).json({
            success: false,
            message: er.message || er
        });
    }
};

export const delete_lead = async (
    req: Request,
    res: Response
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
            return res.status(404).json({ success: false, message: "Лид не найден или уже удален" });
        }

        return res.status(200).json({ success: true, message: "Лид успешно удален" });
    } catch (er: any) {
        console.log(er);
        return res.status(500).json({
            success: false,
            message: er.message || er
        });
    }
};