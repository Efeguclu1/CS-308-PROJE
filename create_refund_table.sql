-- Orders tablosu enum'ını güncelleyerek refund statülerini ekle
ALTER TABLE orders MODIFY COLUMN status ENUM(
    'processing', 
    'in-transit', 
    'delivered', 
    'cancelled',
    'refund-requested',
    'refund-approved',
    'refund-denied'
) NOT NULL DEFAULT 'processing';

-- Refund açıklamaları için orders tablosuna yeni bir alan ekle
ALTER TABLE orders ADD COLUMN refund_reason TEXT DEFAULT NULL; 