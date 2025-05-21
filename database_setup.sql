-- --------------------------------------------------------
-- CS-308 E-Commerce Platform Database Setup
-- --------------------------------------------------------

-- Create and use database
CREATE DATABASE IF NOT EXISTS online_store;
USE online_store;

-- --------------------------------------------------------
-- Core Tables Structure
-- --------------------------------------------------------

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL,
  description TEXT,
  stock INT NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) DEFAULT NULL COMMENT 'Custom cost defined by Product Manager. If NULL, cost is calculated as 50% of price.',
  warranty_months INT NOT NULL DEFAULT 0,
  serial_number VARCHAR(100) DEFAULT NULL,
  distributor_info TEXT,
  category_id INT,
  visible BOOLEAN DEFAULT 1,
  price_approved BOOLEAN DEFAULT FALSE,
  popularity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create index on popularity for better query performance
CREATE INDEX idx_product_popularity ON products (popularity);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  role ENUM('customer', 'product_manager', 'sales_manager', 'admin') DEFAULT 'customer',
  tax_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on tax_id for faster lookups
CREATE INDEX idx_tax_id ON users(tax_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('processing', 'in-transit', 'delivered', 'cancelled', 'refunded', 'refund-requested', 'refund-approved', 'refund-denied') DEFAULT 'processing',
  delivery_address TEXT NOT NULL,
  delivered_at TIMESTAMP NULL,
  refund_reason TEXT DEFAULT NULL,
  admin_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- --------------------------------------------------------
-- Additional Feature Tables
-- --------------------------------------------------------

-- Create payment_info table for storing encrypted payment information
CREATE TABLE IF NOT EXISTS payment_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  encrypted_card_number VARCHAR(255) NOT NULL,
  encrypted_card_name VARCHAR(255) NOT NULL,
  encrypted_expiration_month VARCHAR(255) NOT NULL,
  encrypted_expiration_year VARCHAR(255) NOT NULL,
  encrypted_cvv VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for better performance
CREATE INDEX idx_payment_info_order_id ON payment_info(order_id);

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed', 'fixed_amount') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  product_id INT,
  category VARCHAR(100),
  min_purchase_amount DECIMAL(10,2),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_product_unique (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Triggers
-- --------------------------------------------------------

-- Create a trigger to update popularity when a product is ordered
DELIMITER //
CREATE TRIGGER update_product_popularity
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE products 
  SET popularity = popularity + NEW.quantity 
  WHERE id = NEW.product_id;
END //
DELIMITER ;

-- --------------------------------------------------------
-- Sample Data
-- --------------------------------------------------------

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Computers', 'Desktop and laptop computers'),
('Phones', 'Smartphones and mobile devices'),
('TV & Display', 'Television sets and monitors'),
('Audio', 'Audio equipment and accessories'),
('Gaming', 'Gaming consoles and accessories'),
('Accessories', 'Various tech accessories'),
('Wearable Technology', 'Smart watches and fitness trackers');

-- Insert products
INSERT INTO products (name, model, description, stock, price, warranty_months, category_id, visible) VALUES
('MacBook Pro M2', 'MBP2023', 'Latest MacBook Pro with M2 chip', 10, 1299.99, 24, 1, 1),
('iPhone 15 Pro', 'IP15PRO', 'Latest iPhone with advanced camera system', 20, 999.99, 12, 2, 1),
('Samsung QLED TV', 'QN65Q80C', '65-inch QLED 4K Smart TV', 5, 1499.99, 24, 3, 1),
('Sony WH-1000XM4', 'WH1000XM4', 'Wireless Noise Cancelling Headphones', 15, 349.99, 12, 4, 1),
('PlayStation 5', 'PS5-2023', 'Sony PlayStation 5 Gaming Console', 8, 499.99, 12, 5, 1),
('Dell XPS 13', 'XPS13-2023', 'Premium ultrabook with InfinityEdge display', 12, 1199.99, 24, 1, 1),
('Samsung Galaxy S23', 'S23-Ultra', 'Premium Android smartphone', 25, 899.99, 12, 2, 1),
('LG OLED TV', 'OLED65C3', '65-inch OLED 4K Smart TV', 7, 1799.99, 24, 3, 1),
('Apple AirPods Pro', 'APP2', 'Wireless earbuds with noise cancellation', 30, 249.99, 12, 4, 1),
('Xbox Series X', 'XSX-2023', 'Microsoft Xbox Series X Gaming Console', 10, 499.99, 12, 5, 1),
('Apple Watch Series 8', 'AWS8', 'Latest Apple Watch with health features', 15, 399.99, 12, 7, 1),
('Samsung Galaxy Watch 6', 'GW6', 'Advanced Android smartwatch', 18, 299.99, 12, 7, 1);

-- Update product information
UPDATE products 
SET serial_number = 'MBPS2023001', distributor_info = 'Apple Inc.' 
WHERE name = 'MacBook Pro M2' AND model = 'MBP2023';

UPDATE products 
SET serial_number = 'IP15P2023001', distributor_info = 'Apple Inc.' 
WHERE name = 'iPhone 15 Pro' AND model = 'IP15PRO';

UPDATE products 
SET serial_number = 'SAMQLD2023001', distributor_info = 'Samsung Electronics' 
WHERE name = 'Samsung QLED TV' AND model = 'QN65Q80C';

UPDATE products 
SET serial_number = 'SNY1000XM4001', distributor_info = 'Sony Corporation' 
WHERE name = 'Sony WH-1000XM4' AND model = 'WH1000XM4';

UPDATE products 
SET serial_number = 'PS52023001', distributor_info = 'Sony Interactive Entertainment' 
WHERE name = 'PlayStation 5' AND model = 'PS5-2023';

UPDATE products 
SET serial_number = 'DELLXPS13001', distributor_info = 'Dell Technologies' 
WHERE name = 'Dell XPS 13' AND model = 'XPS13-2023';

UPDATE products 
SET serial_number = 'SAMS23U001', distributor_info = 'Samsung Electronics' 
WHERE name = 'Samsung Galaxy S23' AND model = 'S23-Ultra';

UPDATE products 
SET serial_number = 'LGOLED65C3001', distributor_info = 'LG Electronics' 
WHERE name = 'LG OLED TV' AND model = 'OLED65C3';

UPDATE products 
SET serial_number = 'AIRPODSP2001', distributor_info = 'Apple Inc.' 
WHERE name = 'Apple AirPods Pro' AND model = 'APP2';

UPDATE products 
SET serial_number = 'XBOXX2023001', distributor_info = 'Microsoft Corporation' 
WHERE name = 'Xbox Series X' AND model = 'XSX-2023';

UPDATE products 
SET serial_number = 'APLWS8001', distributor_info = 'Apple Inc.' 
WHERE name = 'Apple Watch Series 8' AND model = 'AWS8';

UPDATE products 
SET serial_number = 'SAMGW6001', distributor_info = 'Samsung Electronics' 
WHERE name = 'Samsung Galaxy Watch 6' AND model = 'GW6';

-- Set price_approved for existing products
SET SQL_SAFE_UPDATES = 0;
UPDATE products SET price_approved = TRUE WHERE price IS NOT NULL AND price > 0;
SET SQL_SAFE_UPDATES = 1;

-- --------------------------------------------------------
-- Initial setup complete
-- -------------------------------------------------------- 