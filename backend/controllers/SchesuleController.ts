import { Request, Response } from 'express';
import pool from '../data_base_connect.js';

export const getSchedule = async (req: Request, res: Response) => {
  try{
    const company_id = req.session.company_id || -1;
    if (company_id === -1) {
      return res.status(401).json({
        success: false,
        message: "user is unauthorized"
      });
    }
    const [rows] = await pool.query('select * from select_schedules_of_groups WHERE company_id = ?', [company_id]);
    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
}