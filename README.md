# Retail Sales and Inventory Business Analytics System

A beginner-friendly Business Analytics capstone project for a small retail business.

## Technology
- Backend: Node.js, Express, TypeScript
- Database: MySQL using mysql2
- Frontend: HTML, CSS, JavaScript
- Charts: Chart.js (planned)

## Project structure
- `public/`: frontend files
- `src/config/`: environment and database configuration
- `src/controllers/`: request handlers
- `src/middlewares/`: Express middleware
- `src/repositories/`: database queries
- `src/routes/`: API routes
- `src/services/`: business logic and analytics
- `src/utils/`: shared helpers
- `database/`: SQL schema

## Requirements
- Node.js (LTS)
- MySQL Server
- npm

## Setup
1. Clone this repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Update the MySQL settings in `.env`.
5. Run `database/schema.sql` in MySQL Workbench or your MySQL client.
6. Run `npm run dev`.
7. Open `http://localhost:7000`.

## Available scripts
- `npm run dev`: start the development server
- `npm run build`: compile TypeScript
- `npm start`: run the compiled server
- `npm run lint`: check source files

## Business Analytics scope
The planned system will support:
1. Descriptive analytics: summarize historical sales and inventory.
2. Predictive analytics: estimate future sales using historical data.
3. Prescriptive analytics: recommend inventory and business actions.

The project will use at least 50 properly documented sales records for its analysis. Do not treat demonstration data as real company data.
