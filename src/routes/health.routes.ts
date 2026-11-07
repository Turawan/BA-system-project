import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      status: "success",
      message: "BA System API and MySQL connection are healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return res.status(503).json({
      status: "error",
      message: "API is running, but MySQL is not connected. Check your .env settings and database server.",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
