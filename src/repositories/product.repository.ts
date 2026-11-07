import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database.js";

export interface ProductInput {
  product_name: string;
  category_id: number;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
}

export async function findAllProducts() {
  const [rows] = await pool.query<ProductRow[]>(`
    SELECT p.product_id, p.product_name, p.category_id, c.category_name,
           p.unit_price, p.stock_quantity, p.reorder_level
    FROM products p
    JOIN categories c ON c.category_id = p.category_id
    ORDER BY p.product_name
  `);
  return rows;
}

export async function createProduct(input: ProductInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO products (product_name, category_id, unit_price, stock_quantity, reorder_level)
     VALUES (?, ?, ?, ?, ?)`,
    [input.product_name, input.category_id, input.unit_price, input.stock_quantity, input.reorder_level]
  );
  return result.insertId;
}

export async function updateProduct(id: number, input: ProductInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE products
     SET product_name = ?, category_id = ?, unit_price = ?, stock_quantity = ?, reorder_level = ?
     WHERE product_id = ?`,
    [input.product_name, input.category_id, input.unit_price, input.stock_quantity, input.reorder_level, id]
  );
  return result.affectedRows;
}

export async function deleteProduct(id: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM products WHERE product_id = ?", [id]
  );
  return result.affectedRows;
}

export async function findProductById(id: number) {
  const [rows] = await pool.execute<ProductRow[]>(
    `SELECT p.product_id, p.product_name, p.category_id, c.category_name,
            p.unit_price, p.stock_quantity, p.reorder_level
     FROM products p JOIN categories c ON c.category_id = p.category_id
     WHERE p.product_id = ?`, [id]
  );
  return rows[0] ?? null;
}
