-- Update the status enum in the orders table to include refund status values
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