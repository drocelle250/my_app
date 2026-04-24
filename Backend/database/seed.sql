-- ============================================================
--  Inventory Management System — Database + Seed Data
--  Run this in phpMyAdmin (XAMPP) or MySQL CLI
-- ============================================================

-- 1. Create & select database
CREATE DATABASE IF NOT EXISTS inventory_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventory_db;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  role       ENUM('admin','manager','staff') DEFAULT 'staff',
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150)   NOT NULL,
  sku               VARCHAR(100)   NOT NULL UNIQUE,
  price             DECIMAL(10,2)  NOT NULL,
  quantity          INT            NOT NULL DEFAULT 0,
  description       TEXT,
  lowStockThreshold INT            DEFAULT 10,
  categoryId        INT            NOT NULL,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Stock History
CREATE TABLE IF NOT EXISTS stock_history (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  productId     INT  NOT NULL,
  type          ENUM('restock','sale','removal','adjustment') NOT NULL,
  quantity      INT  NOT NULL,
  note          TEXT,
  performedById INT,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId)     REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (performedById) REFERENCES users(id)    ON DELETE SET NULL
);

-- ============================================================
-- 3. SEED DATA
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
-- Passwords are bcrypt hashes of: Admin@123 / Manager@123 / Staff@123
INSERT INTO users (name, email, password, role) VALUES
  ('Alice Admin',   'admin@inventory.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Bob Manager',   'manager@inventory.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
  ('Carol Staff',   'staff@inventory.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff'),
  ('David Staff',   'david@inventory.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

-- ── Categories ───────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
  ('Electronics',   'Electronic devices and accessories'),
  ('Clothing',      'Apparel and fashion items'),
  ('Food & Drinks', 'Consumable food and beverage products'),
  ('Furniture',     'Home and office furniture'),
  ('Stationery',    'Office and school supplies');

-- ── Products ─────────────────────────────────────────────────
INSERT INTO products (name, sku, price, quantity, description, lowStockThreshold, categoryId) VALUES
  -- Electronics (categoryId = 1)
  ('Laptop Pro 15',        'ELEC-LAP-001', 1299.99,  25, '15-inch laptop, 16GB RAM, 512GB SSD',  5,  1),
  ('Wireless Mouse',       'ELEC-MOU-002',   29.99,  80, 'Ergonomic wireless mouse, 2.4GHz',     10, 1),
  ('Mechanical Keyboard',  'ELEC-KEY-003',   89.99,  40, 'RGB mechanical keyboard, TKL layout',  8,  1),
  ('USB-C Hub 7-in-1',     'ELEC-HUB-004',   49.99,  60, '7-port USB-C hub with HDMI & PD',     10, 1),
  ('Monitor 27"',          'ELEC-MON-005',  349.99,   8, '27-inch 4K IPS monitor',               5,  1),

  -- Clothing (categoryId = 2)
  ('Men T-Shirt Blue',     'CLTH-TSH-001',   19.99, 120, '100% cotton, sizes S-XXL',            20, 2),
  ('Women Jeans Slim',     'CLTH-JNS-002',   49.99,  55, 'Slim fit denim jeans',                10, 2),
  ('Hoodie Black',         'CLTH-HOD-003',   39.99,  30, 'Unisex fleece hoodie',                 8, 2),
  ('Running Shoes',        'CLTH-SHO-004',   79.99,   7, 'Lightweight running shoes',            5, 2),

  -- Food & Drinks (categoryId = 3)
  ('Mineral Water 1L',     'FOOD-WAT-001',    0.99, 500, 'Natural mineral water, 1 litre',      50, 3),
  ('Green Tea Box',        'FOOD-TEA-002',    5.99, 200, 'Box of 50 green tea bags',            30, 3),
  ('Protein Bar Pack',     'FOOD-PRO-003',   24.99,  90, 'Pack of 12 chocolate protein bars',   15, 3),
  ('Instant Coffee 200g',  'FOOD-COF-004',    8.99,   6, 'Premium instant coffee, 200g jar',    10, 3),

  -- Furniture (categoryId = 4)
  ('Office Chair',         'FURN-CHR-001',  199.99,  12, 'Ergonomic mesh office chair',          3, 4),
  ('Standing Desk',        'FURN-DSK-002',  349.99,   4, 'Height-adjustable standing desk',      2, 4),
  ('Bookshelf 5-Tier',     'FURN-BSH-003',   89.99,  18, 'Wooden 5-tier bookshelf',              3, 4),

  -- Stationery (categoryId = 5)
  ('Ballpoint Pens Box',   'STAT-PEN-001',    4.99, 300, 'Box of 50 blue ballpoint pens',       30, 5),
  ('A4 Paper Ream',        'STAT-PAP-002',    6.99, 150, '500 sheets A4 80gsm paper',           20, 5),
  ('Sticky Notes Pack',    'STAT-STK-003',    3.49,  80, 'Pack of 5 sticky note pads',          15, 5),
  ('Stapler Heavy Duty',   'STAT-STP-004',   12.99,   9, 'Heavy duty stapler, 50 sheets',        5, 5);

-- ── Stock History ─────────────────────────────────────────────
INSERT INTO stock_history (productId, type, quantity, note, performedById) VALUES
  -- Laptop restocked twice, sold once
  (1, 'restock',    30, 'Initial stock intake',          1),
  (1, 'sale',       -5, 'Sold to corporate client',      2),
  (1, 'restock',     0, 'Adjustment after audit',        1),

  -- Wireless Mouse
  (2, 'restock',   100, 'Bulk purchase from supplier',   1),
  (2, 'sale',      -20, 'Online orders batch #1',        3),

  -- Clothing items
  (6, 'restock',   150, 'Summer collection arrival',     2),
  (6, 'sale',      -30, 'Weekend sale event',            3),
  (9, 'restock',    10, 'Restocked running shoes',       2),
  (9, 'sale',       -3, 'In-store sales',                3),

  -- Food items
  (10, 'restock',  600, 'Weekly beverage restock',       2),
  (10, 'sale',    -100, 'Canteen supply',                3),
  (13, 'restock',   10, 'Low stock replenishment',       1),
  (13, 'sale',      -4, 'Sold in store',                 3),

  -- Furniture
  (14, 'restock',   15, 'New office chair shipment',     1),
  (14, 'sale',      -3, 'Sold to client offices',        2),
  (15, 'restock',    5, 'Standing desk restock',         1),
  (15, 'sale',      -1, 'Sold one unit',                 3),

  -- Stationery
  (17, 'restock',  400, 'Quarterly stationery order',    2),
  (17, 'sale',    -100, 'Distributed to departments',    3),
  (20, 'restock',   12, 'Restocked staplers',            2),
  (20, 'sale',      -3, 'Sold in store',                 3);

-- ============================================================
-- 4. VERIFY
-- ============================================================
SELECT 'users'         AS tbl, COUNT(*) AS records FROM users
UNION ALL
SELECT 'categories',           COUNT(*)            FROM categories
UNION ALL
SELECT 'products',             COUNT(*)            FROM products
UNION ALL
SELECT 'stock_history',        COUNT(*)            FROM stock_history;
