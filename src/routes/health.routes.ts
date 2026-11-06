import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "BA System API is healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;
