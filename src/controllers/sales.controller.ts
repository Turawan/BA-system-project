import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database.js";

interface SaleRow extends RowDataPacket {
  sale_id: number;
  transaction_date: string;
  total_amount: number;
  item_count: number;
}

export async function listSales(_req: Request, res: Response) {
  const [rows] = await pool.query<SaleRow[]>(`
    SELECT s.sale_id, s.transaction_date, s.total_amount,
           COUNT(si.sale_item_id) AS item_count
    FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.sale_id
    GROUP BY s.sale_id ORDER BY s.transaction_date DESC LIMIT 100
  `);
  res.json({ data: rows });
}

export async function createSale(req: Request, res: Response) {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Add at least one product to the sale." });
  }

  const normalized = items.map((item: Record<string, unknown>) => ({
    product_id: Number(item.product_id),
    quantity: Number(item.quantity)
  }));
  if (normalized.some((item: {product_id:number;quantity:number}) =>
    !Number.isInteger(item.product_id) || item.product_id < 1 ||
    !Number.isInteger(item.quantity) || item.quantity < 1)) {
    return res.status(400).json({ message: "Each sale item needs a valid product and quantity." });
  }
  const mergedItems = [...normalized.reduce((quantities, item) => {
    quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + item.quantity);
    return quantities;
  }, new Map<number, number>())].map(([product_id, quantity]) => ({ product_id, quantity }));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let total = 0;
    const saleLines: { product_id: number; quantity: number; unit_price: number; subtotal: number }[] = [];

    for (const item of mergedItems) {
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT product_id, unit_price, stock_quantity FROM products WHERE product_id = ? FOR UPDATE",
        [item.product_id]
      );
      const product = rows[0];
      if (!product) throw new Error("A selected product was not found.");
      if (Number(product.stock_quantity) < item.quantity) {
        throw new Error(`Not enough stock for product ID ${item.product_id}.`);
      }
      const unitPrice = Number(product.unit_price);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;
      saleLines.push({ product_id: item.product_id, quantity: item.quantity, unit_price: unitPrice, subtotal });
    }

    const [saleResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO sales (total_amount) VALUES (?)", [total]
    );
    for (const line of saleLines) {
      await connection.execute(
        "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)",
        [saleResult.insertId, line.product_id, line.quantity, line.unit_price, line.subtotal]
      );
      await connection.execute(
        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
        [line.quantity, line.product_id]
      );
    }
    await connection.commit();
    return res.status(201).json({ message: "Sale recorded and inventory updated.", sale_id: saleResult.insertId, total_amount: total });
  } catch (error) {
    await connection.rollback();
    return res.status(400).json({ message: error instanceof Error ? error.message : "Could not record sale." });
  } finally {
    connection.release();
  }
}

export async function deleteSale(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid sale ID." });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [items] = await connection.execute<RowDataPacket[]>(
      "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?", [id]
    );
    const [sale] = await connection.execute<RowDataPacket[]>(
      "SELECT sale_id FROM sales WHERE sale_id = ?", [id]
    );
    if (!sale.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Sale not found." });
    }
    for (const item of items) {
      await connection.execute(
        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );
    }
    await connection.execute("DELETE FROM sale_items WHERE sale_id = ?", [id]);
    await connection.execute("DELETE FROM sales WHERE sale_id = ?", [id]);
    await connection.commit();
    return res.json({ message: "Sale deleted and stock restored." });
  } catch {
    await connection.rollback();
    return res.status(500).json({ message: "Could not delete sale." });
  } finally {
    connection.release();
  }
}
