import type { Request, Response } from "express";
import * as products from "../repositories/product.repository.js";

function readProduct(body: Record<string, unknown>) {
  const product_name = String(body.product_name ?? "").trim();
  const category_id = Number(body.category_id);
  const unit_price = Number(body.unit_price);
  const stock_quantity = Number(body.stock_quantity);
  const reorder_level = Number(body.reorder_level ?? 5);

  if (!product_name || !Number.isInteger(category_id) || category_id < 1 ||
      !Number.isFinite(unit_price) || unit_price < 0 ||
      !Number.isInteger(stock_quantity) || stock_quantity < 0 ||
      !Number.isInteger(reorder_level) || reorder_level < 0) {
    return null;
  }
  return { product_name, category_id, unit_price, stock_quantity, reorder_level };
}

export async function listProducts(_req: Request, res: Response) {
  res.json({ data: await products.findAllProducts() });
}

export async function addProduct(req: Request, res: Response) {
  const input = readProduct(req.body as Record<string, unknown>);
  if (!input) return res.status(400).json({ message: "Please provide valid product details." });
  const id = await products.createProduct(input);
  res.status(201).json({ message: "Product created successfully.", data: await products.findProductById(id) });
}

export async function editProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const input = readProduct(req.body as Record<string, unknown>);
  if (!Number.isInteger(id) || id < 1 || !input) {
    return res.status(400).json({ message: "Please provide a valid product ID and details." });
  }
  const changed = await products.updateProduct(id, input);
  if (!changed) return res.status(404).json({ message: "Product not found." });
  res.json({ message: "Product updated successfully.", data: await products.findProductById(id) });
}

export async function removeProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid product ID." });
  try {
    const deleted = await products.deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: "Product not found." });
    return res.json({ message: "Product deleted successfully." });
  } catch {
    return res.status(409).json({ message: "This product is used in a sale and cannot be deleted. You can set its stock to zero instead." });
  }
}
