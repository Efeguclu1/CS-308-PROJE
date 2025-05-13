-- Admin notları için orders tablosuna yeni bir alan ekle
ALTER TABLE orders ADD COLUMN admin_note TEXT DEFAULT NULL; 