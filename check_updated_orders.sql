-- Check if orders that were just updated now have delivered_at values
SELECT id, status, delivered_at, created_at FROM orders 
WHERE id IN (43, 44, 45); 