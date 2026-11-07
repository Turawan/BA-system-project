import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../config/database.js";

export async function overview(_req: Request, res: Response) {
  const [totals] = await pool.query<RowDataPacket[]>(`
    SELECT
      COALESCE((SELECT SUM(total_amount) FROM sales), 0) AS total_sales,
      (SELECT COUNT(*) FROM sales) AS transaction_count,
      (SELECT COUNT(*) FROM products) AS product_count,
      (SELECT COUNT(*) FROM products WHERE stock_quantity <= reorder_level) AS low_stock_count
  `);
  const [topProducts] = await pool.query<RowDataPacket[]>(`
    SELECT p.product_name, SUM(si.quantity) AS units_sold, SUM(si.subtotal) AS revenue
    FROM sale_items si JOIN products p ON p.product_id = si.product_id
    GROUP BY p.product_id, p.product_name
    ORDER BY units_sold DESC LIMIT 5
  `);
  res.json({ data: { ...totals[0], top_products: topProducts } });
}

export async function monthlySales(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
           SUM(total_amount) AS sales, COUNT(*) AS transactions
    FROM sales
    WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month
  `);
  res.json({ data: rows });
}

export async function forecast(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month, SUM(total_amount) AS sales
    FROM sales
    WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month
  `);
  const values = rows.map((row) => Number(row.sales));
  const prediction = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  res.json({
    method: "Three-month moving average",
    note: "This is a simple estimate based on available monthly sales. It is not a guarantee of future sales.",
    months_used: values.length,
    predicted_next_month_sales: Number(prediction.toFixed(2)),
    historical_months: rows
  });
}

export async function recommendations(_req: Request, res: Response) {
  const [lowStock] = await pool.query<RowDataPacket[]>(`
    SELECT product_id, product_name, stock_quantity, reorder_level,
           GREATEST(reorder_level * 2 - stock_quantity, 0) AS suggested_restock
    FROM products WHERE stock_quantity <= reorder_level
    ORDER BY stock_quantity ASC
  `);
  const [slowProducts] = await pool.query<RowDataPacket[]>(`
    SELECT p.product_id, p.product_name, COALESCE(SUM(si.quantity), 0) AS units_sold
    FROM products p LEFT JOIN sale_items si ON si.product_id = p.product_id
    GROUP BY p.product_id, p.product_name
    ORDER BY units_sold ASC LIMIT 5
  `);
  const recommendationsList = [
    ...lowStock.map((item) => ({
      type: "Restock",
      priority: "High",
      product: item.product_name,
      reason: `Only ${item.stock_quantity} units remain; reorder level is ${item.reorder_level}.`,
      action: `Consider restocking approximately ${item.suggested_restock} units.`
    })),
    ...slowProducts.filter((item) => Number(item.units_sold) === 0).map((item) => ({
      type: "Review",
      priority: "Medium",
      product: item.product_name,
      reason: "No sales are recorded for this product.",
      action: "Review its price, visibility, and customer demand before ordering more."
    }))
  ];
  res.json({ data: recommendationsList });
}
