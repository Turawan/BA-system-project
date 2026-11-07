import { Router } from "express";
import { addProduct, editProduct, listProducts, removeProduct } from "../controllers/product.controller.js";

const router = Router();
router.get("/", listProducts);
router.post("/", addProduct);
router.put("/:id", editProduct);
router.delete("/:id", removeProduct);
export default router;
