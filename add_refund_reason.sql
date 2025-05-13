-- Check if refund_reason column exists
SELECT COUNT(*) AS column_exists
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'refund_reason';

-- Add refund_reason column to orders table
ALTER TABLE orders ADD COLUMN refund_reason TEXT DEFAULT NULL; 