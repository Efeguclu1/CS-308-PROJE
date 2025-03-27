const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Order routes are working' });
});

// Kullanıcının siparişlerini getir
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log('Fetching orders for user ID:', userId);
  
  try {
    // Önce veritabanı bağlantısını kontrol et
    db.query('SELECT 1', (err) => {
      if (err) {
        console.error('Database connection error:', err);
        return res.status(500).json({ success: false, error: 'Database connection error' });
      }
    });

    // Kullanıcının siparişlerini getir
    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log('Found orders:', orders.length);
    
    // Eğer hiç sipariş yoksa, boş array dön
    if (orders.length === 0) {
      return res.json([]);
    }
    
    // Her sipariş için ürünleri getir
    const ordersWithItems = [];
    
    for (const order of orders) {
      try {
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        
        console.log(`Found ${items.length} items for order ${order.id}`);
        
        ordersWithItems.push({
          ...order,
          items: items || []
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        // Hata olsa bile siparişi ekle, ama boş ürün listesi ile
        ordersWithItems.push({
          ...order,
          items: []
        });
      }
    }
    
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL error:', error.sqlMessage);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders', 
      details: error.message 
    });
  }
});

// Tek bir siparişin detaylarını getir
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  console.log('Fetching single order details for ID:', orderId);
  
  try {
    // Siparişi getir
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Sipariş ürünlerini getir
    try {
      const [items] = await db.promise().query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      res.json({
        ...order,
        items: items || []
      });
    } catch (itemsError) {
      console.error('Error fetching order items:', itemsError);
      // Ürünleri getiremesek bile siparişi dön
      res.json({
        ...order,
        items: []
      });
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL error:', error.sqlMessage);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch order details',
      details: error.message
    });
  }
});

module.exports = router; 