import { Router } from "express";
import { createSale, deleteSale, listSales } from "../controllers/sales.controller.js";

const router = Router();
router.get("/", listSales);
router.post("/", createSale);
router.delete("/:id", deleteSale);
export default router;
