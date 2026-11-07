CREATE DATABASE IF NOT EXISTS ba_retail_analytics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ba_retail_analytics;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS sale_items (
  sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id)
    REFERENCES sales(sale_id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id)
    REFERENCES products(product_id)
);

CREATE INDEX idx_sales_date ON sales(transaction_date);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

INSERT IGNORE INTO categories (category_name) VALUES
('Groceries'), ('Beverages'), ('Household'), ('Personal Care'), ('Snacks');
