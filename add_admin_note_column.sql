-- Add admin_note column to orders table
ALTER TABLE orders ADD COLUMN admin_note TEXT DEFAULT NULL; 