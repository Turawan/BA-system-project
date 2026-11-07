import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import productRoutes from "./routes/product.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import categoryRoutes from "./routes/category.routes.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.frontendUrl }));
app.use(hpp());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(express.static("public"));

app.use((_req, res) => res.status(404).json({ message: "Route not found." }));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

export default app;
