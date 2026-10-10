import type { Request, Response, NextFunction } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../data_base_connect.js";

export function hasValidSession(req: Request): boolean {
  const s = req.session;
  return !!s && typeof s.user_id === "number" && Number.isSafeInteger(s.user_id) && s.user_id > 0 &&
    typeof s.company_id === "number" && Number.isSafeInteger(s.company_id) && s.company_id > 0 &&
    typeof s.rank === "number" && Number.isSafeInteger(s.rank) && s.rank >= 0;
}

export function authorize(req: Request, res: Response, minimumRank = 0): boolean {
  if (!hasValidSession(req)) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return false;
  }
  if (req.session.rank! < minimumRank) {
    res.status(403).json({ success: false, message: "Insufficient permissions" });
    return false;
  }
  return true;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!authorize(req, res)) return;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, company_id, `rank`, role FROM users WHERE id = ? AND company_id = ?",
      [req.session.user_id, req.session.company_id],
    );
    const user = rows[0];
    if (!user || !Number.isSafeInteger(user.rank) || user.rank < 0) {
      res.status(401).json({ success: false, message: "Session is no longer valid" });
      return;
    }
    req.session.rank = user.rank;
    req.session.user_role = user.role;
    next();
  } catch (error) {
    console.error("Authentication lookup failed:", error);
    res.status(503).json({ success: false, message: "Unable to verify authentication" });
  }
}

export const requireRank = (minimumRank: number) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (authorize(req, res, minimumRank)) next();
  };
