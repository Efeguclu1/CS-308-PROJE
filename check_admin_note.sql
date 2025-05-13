-- Check if admin_note column exists in orders table
SELECT COUNT(*) AS column_exists
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'admin_note'; 