# Retail Sales and Inventory Business Analytics System

A student capstone project for a small retail business. It helps users record sales, manage products and stock, and review descriptive, predictive, and prescriptive analytics.

## Technology
- Backend: Node.js, Express 5, TypeScript
- Database: MySQL 8+ with mysql2
- Frontend: HTML, CSS, JavaScript
- Charts: Chart.js (loaded from CDN)

## Features
- Product CRUD: create, view, update, and delete products
- Sales: record a transaction, view recent transactions, and void a sale
- Inventory: automatically deduct stock after a sale and restore it when a sale is voided
- Dashboard: revenue, transaction count, product count, low-stock count, monthly sales chart, and best sellers
- Descriptive analytics: summaries of historical sales and top-selling products
- Predictive analytics: a simple three-month moving-average sales estimate
- Prescriptive analytics: low-stock restock suggestions and a review alert for products with no recorded sales

## Project structure
- `public/`: HTML, CSS, and browser JavaScript
- `src/config/`: environment and MySQL connection
- `src/controllers/`: API request handlers
- `src/repositories/`: product database queries
- `src/routes/`: API routes
- `src/services/`: reserved for shared business logic as the project grows
- `database/schema.sql`: database and table creation script

## Requirements
- Node.js LTS and npm
- MySQL Server 8 or later
- MySQL Workbench (recommended)
- Git

## Setup
1. Clone the repository:
   `git clone https://github.com/Turawan/BA-system-project.git`
2. Enter the project:
   `cd BA-system-project`
3. Install dependencies:
   `npm install`
4. Copy the environment template:
   - PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
5. Open `.env` and set your local MySQL username and password.
6. Open MySQL Workbench, connect to your local server, open `database/schema.sql`, and execute the full script. It creates the `ba_retail_analytics` database and its tables.
7. Start the app:
   `npm run dev`
8. Open `http://localhost:7000`.

## Environment variables
```env
APP_NAME=Retail Sales and Inventory BA System
PORT=7000
NODE_ENV=development
FRONTEND_URL=http://localhost:7000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ba_retail_analytics
```

Never commit your real `.env` file or database password. The `.gitignore` file excludes it.

## API endpoints
- `GET /api/health` — API health check
- `GET /api/categories` — list product categories
- `GET /api/products` — list products
- `POST /api/products` — create product
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — delete product (a product already used in sales cannot be deleted)
- `GET /api/sales` — list recent sales
- `POST /api/sales` — record a sale; stock is deducted in a database transaction
- `DELETE /api/sales/:id` — void a sale and restore stock
- `GET /api/analytics/overview` — dashboard totals and best sellers
- `GET /api/analytics/monthly-sales` — monthly revenue
- `GET /api/analytics/forecast` — moving-average estimate
- `GET /api/analytics/recommendations` — inventory recommendations

## Business Analytics process
1. **Descriptive:** describe what happened using recorded revenue, transaction counts, best sellers, and monthly trends.
2. **Predictive:** estimate next month's sales using the average of up to the last three available monthly totals. This simple model needs enough historical data and is not a guarantee.
3. **Prescriptive:** suggest restocking when stock reaches the reorder level and reviewing products with no recorded sales.

## Important project-data note
The database starts with product categories but no fabricated sales history. Enter your group's collected business data. Your course requires at least 50 data records across at least five variables. Keep the source and collection method of the data in your project documentation. Do not present invented or demonstration records as real company data.

## Scripts
- `npm run dev` — run the development server
- `npm run build` — compile TypeScript into `dist/`
- `npm start` — run the compiled app
- `npm run lint` — run ESLint
