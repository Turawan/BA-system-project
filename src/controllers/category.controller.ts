import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../config/database.js";

export async function listCategories(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT category_id, category_name FROM categories ORDER BY category_name"
  );
  res.json({ data: rows });
}
