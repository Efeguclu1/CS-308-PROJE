const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Order route accessed: ${req.method} ${req.url}`);
  console.log('User from token:', req.user);
  console.log('Request headers:', req.headers);
  next();
});

// Admin: Get all orders with optional status filter
router.get('/', async (req, res) => {
  console.log('Fetching all orders for admin');
  console.log('Request query:', req.query);
  console.log('Auth user from token:', req.user);
  
  // Check if user is admin or product manager
  if (!req.user || req.user.role !== 'product_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only product managers can access this endpoint' 
    });
  }
  
  try {
    let query = `
      SELECT o.*, u.name AS user_name 
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    const params = [];
    
    // Add status filter if provided
    if (req.query.status) {
      query += ' WHERE o.status = ?';
      params.push(req.query.status);
    }
    
    // Add order by
    query += ' ORDER BY o.created_at DESC';
    
    const [orders] = await db.promise().query(query, params);
    
    console.log(`Found ${orders.length} orders`);
    
    // If no orders found, return empty array
    if (orders.length === 0) {
      return res.json([]);
    }
    
    // Get order items for each order
    const ordersWithItems = [];
    
    for (const order of orders) {
      try {
        console.log(`Fetching items for order ${order.id}`);
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        
        ordersWithItems.push({
          ...order,
          items: items || []
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        ordersWithItems.push({
          ...order,
          items: []
        });
      }
    }
    
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders', 
      details: error.message 
    });
  }
});

// Kullanıcının siparişlerini getir
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching orders for user ID:', userId);
  console.log('Request headers:', req.headers);
  console.log('Request params:', req.params);
  console.log('Auth user from token:', req.user);
  
  try {
    // Veritabanı bağlantısını kontrol et
    await db.promise().query('SELECT 1');
    console.log('Database connection is working');

    // Önce kullanıcının var olduğunu kontrol et
    const [users] = await db.promise().query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Kullanıcının siparişlerini getir
    console.log('Executing query to get orders for user:', userId);
    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log('Found orders:', orders);
    
    // Eğer hiç sipariş yoksa, boş array dön
    if (orders.length === 0) {
      console.log('No orders found for user:', userId);
      return res.json([]);
    }
    
    // Her sipariş için ürünleri getir
    const ordersWithItems = [];
    
    for (const order of orders) {
      try {
        console.log(`Fetching items for order ${order.id}`);
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        
        console.log(`Found ${items.length} items for order ${order.id}:`, items);
        
        ordersWithItems.push({
          ...order,
          items: items || []
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        ordersWithItems.push({
          ...order,
          items: []
        });
      }
    }
    
    console.log('Sending response with orders:', ordersWithItems);
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
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

// Sipariş durumunu güncelle
router.patch('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  console.log(`Updating order ${orderId} status to ${status}`);
  console.log('User from token:', req.user);
  
  // Check if user is admin or product manager
  if (!req.user || req.user.role !== 'product_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only product managers can update order status' 
    });
  }
  
  if (!['processing', 'in-transit', 'delivered'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }
  try {
    const [result] = await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order status updated', status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// Siparişi iptal et
router.patch('/:orderId/cancel', async (req, res) => {
  const { orderId } = req.params;
  console.log('=== Cancel Order Debug ===');
  console.log('OrderId:', orderId);
  console.log('User from token:', req.user);
  
  if (!req.user || !req.user.id) {
    console.log('No user in request');
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    await db.promise().beginTransaction();
    
    // Test database connection first
    await db.promise().query('SELECT 1');
    
    // Önce siparişi getir
    console.log('Fetching order details...');
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    console.log('Found orders:', orders);
    
    if (orders.length === 0) {
      console.log('Order not found');
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    const order = orders[0];
    console.log('Order details:', order);
    console.log('Current user ID:', req.user.id, '(type:', typeof req.user.id, ')');
    console.log('Order user ID:', order.user_id, '(type:', typeof order.user_id, ')');
    
    // Convert both IDs to strings for comparison
    const userId = String(req.user.id);
    const orderUserId = String(order.user_id);
    
    console.log('Comparing user IDs:', userId, 'vs', orderUserId);
    
    // Kullanıcının kendi siparişini iptal etme yetkisi var mı kontrol et
    if (userId !== orderUserId) {
      console.log('User ID mismatch - unauthorized cancel attempt');
      return res.status(403).json({ 
        success: false, 
        error: 'You can only cancel your own orders',
        debug: {
          userId: userId,
          orderUserId: orderUserId
        }
      });
    }
    
    // Sipariş sadece "processing" durumunda iptal edilebilir
    console.log('Order status:', order.status);
    if (order.status !== 'processing') {
      console.log('Invalid order status for cancellation');
      return res.status(400).json({ 
        success: false, 
        error: 'Only orders in "processing" status can be cancelled' 
      });
    }
    
    // Siparişi "cancelled" durumuna güncelle
    console.log('Updating order status to cancelled...');
    const [updateResult] = await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', orderId]
    );
    
    console.log('Update result:', updateResult);
    
    if (updateResult.affectedRows === 0) {
      console.log('No rows affected by update');
      throw new Error('Failed to update order status');
    }
    
    console.log('Order cancelled successfully');
    await db.promise().commit();
    res.json({ 
      success: true, 
      message: 'Order cancelled successfully' 
    });
    
  } catch (error) {
    await db.promise().rollback();
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      // Handle database connection issues
      return res.status(500).json({
        success: false,
        error: 'Database connection error',
        details: error.message
      });
    }
    console.error('=== Detailed Error Log ===');
    console.error('Request body:', req.body);
    console.error('Request user:', req.user);
    console.error('Database connection status:', db.state);
    console.error('Error:', error);
    console.error('=== Error Details ===');
    console.error('Error cancelling order:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) console.error('SQL Error code:', error.code);
    if (error.sqlMessage) console.error('SQL Error message:', error.sqlMessage);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel order',
      details: error.message,
      debug: {
        errorName: error.name,
        errorCode: error.code,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

module.exports = router; 