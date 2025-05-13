const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendOrderInTransitEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } = require('../utils/emailService');

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
  
  if (!['processing', 'in-transit', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }
  
  try {
    // First, get the current order information including previous status
    const [orderResult] = await db.promise().query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const order = orderResult[0];
    const previousStatus = order.status;
    
    // Update the order status
    const [result] = await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Send appropriate email notification based on the new status
    try {
      // Only send email if status has changed
      if (status !== previousStatus) {
        // Send in-transit notification
        if (status === 'in-transit') {
          await sendOrderInTransitEmail(order.email, order.name, order);
          console.log(`In-transit email sent to ${order.email} for order #${orderId}`);
        }
        
        // Send delivered notification
        else if (status === 'delivered') {
          await sendOrderDeliveredEmail(order.email, order.name, order);
          console.log(`Delivered email sent to ${order.email} for order #${orderId}`);
        }
        
        // Send cancellation notification
        else if (status === 'cancelled') {
          await sendOrderCancelledEmail(order.email, order.name, order);
          console.log(`Cancellation email sent to ${order.email} for order #${orderId}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // We don't want to fail the request if email sending fails
      // Just log the error and continue
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
    
    // Önce siparişi getir (kullanıcı email ve isim bilgilerini de getir)
    console.log('Fetching order details...');
    const [orders] = await db.promise().query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
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
    router.post('/orders/:id/refund', (req, res) => {
      const orderId = req.params.id;
    
      const query = 'SELECT status FROM orders WHERE id = ?';
      db.query(query, [orderId], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    
        const status = results[0].status;
        if (status !== 'delivered') {
          return res.status(400).json({ error: 'Only delivered orders can be refunded' });
        }
    
        const update = 'UPDATE orders SET status = ? WHERE id = ?';
        db.query(update, ['refunded', orderId], (err2) => {
          if (err2) return res.status(500).json({ error: 'Refund failed' });
          return res.status(200).json({ message: 'Order refunded successfully' });
        });
    
        // İsteğe bağlı log
        const order = results[0];
        console.log('Order details:', order);
      });
    });
    // Sipariş oluştur
router.post("/create", async (req, res) => {
  const { user_id, items, total_amount, delivery_address } = req.body;

  if (!user_id || !items || items.length === 0 || !total_amount || !delivery_address) {
    return res.status(400).json({ error: "Eksik sipariş bilgisi" });
  }

  try {
    // Siparişi oluştur
    const [orderResult] = await db.promise().query(
      "INSERT INTO orders (user_id, total_amount, status, delivery_address) VALUES (?, ?, 'processing', ?)",
      [user_id, total_amount, delivery_address]
    );

    const orderId = orderResult.insertId;

    // Sipariş ürünlerini ekle
    for (const item of items) {
      await db.promise().query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({ success: true, message: "Sipariş oluşturuldu", orderId });
  } catch (err) {
    console.error("Sipariş oluşturulurken hata:", err);
    res.status(500).json({ error: "Sipariş oluşturulamadı" });
  }
});

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
    
    // Send cancellation email (email ve name değerleri artık mevcut)
    try {
      console.log(`Attempting to send email to ${order.email} for user ${order.name}`);
      await sendOrderCancelledEmail(order.email, order.name, order);
      console.log(`Cancellation email sent to ${order.email} for order #${orderId}`);
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      console.error('Email error details:', emailError.message);
      // We don't want to fail the request if email sending fails
      // Just log the error and continue
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
// Delivered durumundaki siparişi refund et (kısa yol)
router.post('/:id/refund', async (req, res) => {
  const orderId = req.params.id;

  try {
    // Siparişi kontrol et
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be refunded' });
    }

    // Sipariş durumunu refunded yap
    await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['refunded', orderId]
    );

    res.status(200).json({ message: 'Order refunded successfully' });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test: Sahte teslim edilmiş siparişi döndür


module.exports = router; 