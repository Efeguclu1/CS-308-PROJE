-- Add delivered_at column to orders table
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL;

-- Update existing delivered orders to have a delivered_at date
-- (setting it to creation date for existing orders as an approximation)
UPDATE orders SET delivered_at = created_at WHERE status = 'delivered'; 