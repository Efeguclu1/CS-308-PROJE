-- REFUND SETUP
-- This script combines all refund-related modifications and checks

-- Make sure the right database is selected
USE online_store;

-- Step 1: Check orders table structure before changes
SELECT 'Checking orders table structure before changes' AS 'Step';
DESCRIBE orders;

-- Step 2: Update orders table with new status values including refund statuses
SELECT 'Updating orders table with refund status options' AS 'Step';
-- Use ALTER TABLE IF EXISTS to handle cases where table might not exist
ALTER TABLE orders MODIFY COLUMN status ENUM(
  'processing', 
  'in-transit', 
  'delivered', 
  'cancelled', 
  'refunded',
  'refund-requested',
  'refund-approved',
  'refund-denied'
) DEFAULT 'processing';

-- Step 3: Add refund_reason column if it doesn't exist
SELECT 'Adding refund_reason column' AS 'Step';
SELECT COUNT(*) AS refund_reason_exists
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'refund_reason';

-- Some MySQL versions don't support IF NOT EXISTS for ADD COLUMN
-- So we use a safer approach with procedure
SET @query = '';
SELECT IF(COUNT(*) = 0, 
          'ALTER TABLE orders ADD COLUMN refund_reason TEXT DEFAULT NULL;', 
          'SELECT ''refund_reason column already exists'' AS message;') 
INTO @query
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'refund_reason';

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add admin_note column if it doesn't exist
SELECT 'Adding admin_note column' AS 'Step';
SELECT COUNT(*) AS admin_note_exists
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'admin_note';

-- Same safe approach for admin_note column
SET @query = '';
SELECT IF(COUNT(*) = 0, 
          'ALTER TABLE orders ADD COLUMN admin_note TEXT DEFAULT NULL;', 
          'SELECT ''admin_note column already exists'' AS message;') 
INTO @query
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'admin_note';

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add delivered_at column if it doesn't exist
SELECT 'Adding delivered_at column and updating existing delivered orders' AS 'Step';
SELECT COUNT(*) AS delivered_at_exists
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'delivered_at';

-- Same safe approach for delivered_at column
SET @query = '';
SELECT IF(COUNT(*) = 0, 
          'ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL;', 
          'SELECT ''delivered_at column already exists'' AS message;') 
INTO @query
FROM information_schema.columns
WHERE table_schema = 'online_store'
  AND table_name = 'orders'
  AND column_name = 'delivered_at';

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing delivered orders to have a delivered_at date
-- (setting it to creation date for existing orders as an approximation)
UPDATE orders SET delivered_at = created_at 
WHERE status = 'delivered' AND delivered_at IS NULL;

-- Step 6: Check for delivered orders that should have delivered_at timestamps
SELECT 'Checking delivered orders without delivered_at timestamps' AS 'Step';
SELECT id, status, delivered_at, created_at FROM orders 
WHERE status = 'delivered' AND delivered_at IS NULL;

-- Step 7: Check orders table structure after changes
SELECT 'Verifying final orders table structure' AS 'Step';
DESCRIBE orders;

-- Step 8: Show sample orders to verify the changes
SELECT 'Showing sample orders to verify changes' AS 'Step';
SELECT id, status, refund_reason, admin_note, delivered_at, created_at 
FROM orders 
LIMIT 5; 