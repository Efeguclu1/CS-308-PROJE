-- Check orders table structure
DESCRIBE orders;

-- Check available status values
SHOW COLUMNS FROM orders LIKE 'status';

-- Check if refund_reason column exists
SELECT * FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'refund_reason'; 