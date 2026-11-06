import "dotenv/config";

export const env = {
  appName: process.env.APP_NAME ?? "Retail Sales and Inventory BA System",
  port: Number(process.env.PORT ?? 7000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:7000",
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "ba_retail_analytics"
  }
};
