import { Router } from "express";
import { monthlySales, overview, forecast, recommendations } from "../controllers/analytics.controller.js";

const router = Router();
router.get("/overview", overview);
router.get("/monthly-sales", monthlySales);
router.get("/forecast", forecast);
router.get("/recommendations", recommendations);
export default router;
