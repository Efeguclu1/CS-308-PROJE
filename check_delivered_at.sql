-- Check for delivered orders with NULL delivered_at
SELECT id, status, delivered_at, created_at FROM orders 
WHERE status = 'delivered' AND delivered_at IS NULL;

-- Update any delivered orders with NULL delivered_at
UPDATE orders SET delivered_at = created_at 
WHERE status = 'delivered' AND delivered_at IS NULL; 