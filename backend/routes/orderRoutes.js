const express = require('express');
const router = express.Router();
const db = require('../config/db');
<<<<<<< Updated upstream
const { sendOrderInTransitEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } = require('../utils/emailService');
=======
const { sendOrderStatusEmail } = require('../utils/emailService');
>>>>>>> Stashed changes

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

// Admin: Update order status
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
<<<<<<< Updated upstream
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
    
    // If status is 'delivered', also update the delivered_at timestamp
    let query = '';
    const params = [];
    
    if (status === 'delivered') {
      query = 'UPDATE orders SET status = ?, delivered_at = NOW() WHERE id = ?';
      params.push(status, orderId);
    } else {
      query = 'UPDATE orders SET status = ? WHERE id = ?';
      params.push(status, orderId);
    }
    
    const [result] = await db.promise().query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Send appropriate email notification based on the new status
    try {
      // Only send email if status has changed
      if (status !== previousStatus) {
        // Get order items for the email
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [orderId]
        );
        
        // Use the newer combined email service
        await sendOrderStatusEmail({
          to: order.email,
          name: order.name,
          orderId: order.id,
          status: status,
          orderDetails: {
            ...order,
            items: items || []
          }
        });
        
        console.log(`Status update email sent to ${order.email} for order #${orderId}`);
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // We don't want to fail the request if email sending fails
      // Just log the error and continue
=======
    // If status is 'delivered', also update the delivered_at timestamp
    let query = '';
    const params = [];
    
    if (status === 'delivered') {
      query = 'UPDATE orders SET status = ?, delivered_at = NOW() WHERE id = ?';
      params.push(status, orderId);
    } else {
      query = 'UPDATE orders SET status = ? WHERE id = ?';
      params.push(status, orderId);
    }
    
    const [result] = await db.promise().query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Send email notification for the status change
    try {
      // Get order details with user information
      const [orders] = await db.promise().query(
        'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
        [orderId]
      );
      
      if (orders.length === 0) {
        console.error(`Could not find order ${orderId} for email notification`);
      } else {
        const order = orders[0];
        console.log(`Sending ${status} email notification to ${order.email}`);

        // Get order items
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [orderId]
        );

        // Send the email
        await sendOrderStatusEmail({
          to: order.email,
          name: order.name,
          orderId: order.id,
          status: status,
          orderDetails: {
            ...order,
            items: items || []
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send order status email:', emailError);
      // Continue with response even if email fails
>>>>>>> Stashed changes
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
    
<<<<<<< Updated upstream
    // Send cancellation email (email ve name değerleri artık mevcut)
    try {
      console.log(`Sending cancellation email to ${order.email}`);
      // Use the newer combined email service
      await sendOrderStatusEmail({
        to: order.email,
        name: order.name,
        orderId: order.id,
        status: 'cancelled',
        orderDetails: {
          total_amount: order.total_amount,
          items: items || []
        },
        additionalInfo: req.body.cancellation_reason || 'Customer requested cancellation'
      });
      console.log(`Cancellation email sent to ${order.email} for order #${orderId}`);
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      console.error('Email error details:', emailError.message);
      // We don't want to fail the request if email sending fails
      // Just log the error and continue
    }
    
    console.log('Order cancelled successfully');
    await db.promise().commit();
=======
    // Restore product stock quantities - After cancellation is committed
    try {
      console.log(`======= ORDER CANCELLATION STOCK UPDATE DEBUG (Order #${orderId}) =======`);
      
      // Create a separate transaction for stock updates
      await db.promise().beginTransaction();
      
      // Get order items
      const [orderItems] = await db.promise().query(
        `SELECT oi.*, p.name, p.stock
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      console.log(`Found ${orderItems.length} items to update stock for cancellation`);
      
      // Flag to track if all updates succeeded
      let allUpdatesSuccessful = true;
      
      // Update stock for each item individually
      for (const item of orderItems) {
        console.log(`Updating stock for product ${item.product_id} (${item.name}), current stock: ${item.stock}, adding: ${item.quantity}`);
        
        // Use FOR UPDATE to lock the row during update
        const [currentProductData] = await db.promise().query(
          'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        
        if (currentProductData.length === 0) {
          console.error(`Product ${item.product_id} not found!`);
          allUpdatesSuccessful = false;
          continue;
        }
        
        const updateQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
        const [updateResult] = await db.promise().query(updateQuery, [item.quantity, item.product_id]);
        
        const updateSuccess = updateResult.affectedRows > 0;
        console.log(`Stock update result for product ${item.product_id}:`, updateSuccess ? 'SUCCESS' : 'FAILED');
        
        if (!updateSuccess) {
          allUpdatesSuccessful = false;
        }
        
        // Verify the update
        const [updatedProduct] = await db.promise().query(
          'SELECT id, name, stock FROM products WHERE id = ?',
          [item.product_id]
        );
        
        if (updatedProduct.length > 0) {
          console.log(`Product ${item.product_id} new stock: ${updatedProduct[0].stock} (was: ${item.stock}, change: ${updatedProduct[0].stock - item.stock})`);
        }
      }
      
      // Commit or rollback based on success
      if (allUpdatesSuccessful) {
        await db.promise().commit();
        console.log('Stock update transaction committed successfully');
      } else {
        await db.promise().rollback();
        console.log('Stock update transaction rolled back due to errors');
        
        // Log this for investigation
        console.error(`CRITICAL: Failed to update stock for cancelled order #${orderId}. Manual intervention required.`);
      }
      
      console.log(`======= END OF ORDER CANCELLATION STOCK UPDATE DEBUG =======`);
    } catch (stockError) {
      console.error('Error restoring product stock after cancellation:', stockError);
      
      // Try to rollback if there was an error during the stock update transaction
      try {
        await db.promise().rollback();
        console.log('Stock update transaction rolled back after error');
      } catch (rollbackError) {
        console.error('Error rolling back stock update transaction:', rollbackError);
      }
      
      // Log this critical error for monitoring systems
      console.error(`CRITICAL ERROR: Failed to update stock for cancelled order #${orderId}. Manual intervention required.`);
    }
    
    // Get user email to send notification
    try {
      const [userResult] = await db.promise().query(
        'SELECT email, name FROM users WHERE id = ?',
        [order.user_id]
      );
      
      if (userResult.length > 0) {
        const user = userResult[0];
        
        // Get order items for the email
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [orderId]
        );
        
        // Send email notification about order cancellation
        await sendOrderStatusEmail({
          to: user.email,
          name: user.name,
          orderId: order.id,
          status: 'cancelled',
          orderDetails: {
            total_amount: order.total_amount,
            items: items || []
          },
          additionalInfo: req.body.cancellation_reason || 'Customer requested cancellation'
        });
        
        console.log(`Cancellation email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send order cancellation email:', emailError);
      // Continue with response even if email fails
    }
    
>>>>>>> Stashed changes
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
    console.error('===========');
    
    return res.status(500).json({
      success: false,
      error: 'An error occurred while cancelling the order',
      details: error.message
    });
  }
});

// Delivered durumundaki siparişi refund et (kısa yol)
router.post('/:orderId/refund-request', async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  
  console.log(`Processing refund request for order ${orderId} by user ${userId}`);
  
  try {
    // Verify the order exists and belongs to the user
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or does not belong to you'
      });
    }
    
    const order = orders[0];
    
    // Verify the order status is 'delivered'
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Only delivered orders can be refunded'
      });
    }
    
    // Create a refund request
    const [result] = await db.promise().query(
      `INSERT INTO refund_requests 
       (order_id, user_id, reason, status, requested_at) 
       VALUES (?, ?, ?, 'pending', NOW())`,
      [orderId, userId, reason || 'No reason provided']
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Failed to create refund request');
    }
    
    // Update order status to indicate a refund is requested
    await db.promise().query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['refund-requested', orderId]
    );
    
    // Get user info for email
    const [users] = await db.promise().query(
      'SELECT email, name FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length > 0) {
      const user = users[0];
      
      // Get order items for the email
      const [items] = await db.promise().query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      // Send email notification about refund request
      try {
        await sendOrderStatusEmail({
          to: user.email,
          name: user.name,
          orderId: order.id,
          status: 'refund-requested',
          orderDetails: {
            total_amount: order.total_amount,
            items: items || []
          },
          additionalInfo: reason || 'No reason provided'
        });
        
        console.log(`Refund request email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send refund request email:', emailError);
        // Continue with response even if email fails
      }
    }
    
    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      refundId: result.insertId
    });
  } catch (error) {
    console.error('Error processing refund request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund request',
      details: error.message
    });
  }
});
<<<<<<< Updated upstream
=======

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

    // Restore product stock quantities - After refund status is updated
    try {
      console.log(`======= DIRECT REFUND STOCK UPDATE DEBUG (Order #${orderId}) =======`);
      
      // Create a separate transaction for stock updates
      await db.promise().beginTransaction();
      
      // Get order items
      const [orderItems] = await db.promise().query(
        `SELECT oi.*, p.name, p.stock
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      console.log(`Found ${orderItems.length} items to update stock for direct refund`);
      
      // Flag to track if all updates succeeded
      let allUpdatesSuccessful = true;
      
      // Update stock for each item individually
      for (const item of orderItems) {
        console.log(`Updating stock for product ${item.product_id} (${item.name}), current stock: ${item.stock}, adding: ${item.quantity}`);
        
        // Use FOR UPDATE to lock the row during update
        const [currentProductData] = await db.promise().query(
          'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        
        if (currentProductData.length === 0) {
          console.error(`Product ${item.product_id} not found!`);
          allUpdatesSuccessful = false;
          continue;
        }
        
        const updateQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
        const [updateResult] = await db.promise().query(updateQuery, [item.quantity, item.product_id]);
        
        const updateSuccess = updateResult.affectedRows > 0;
        console.log(`Stock update result for product ${item.product_id}:`, updateSuccess ? 'SUCCESS' : 'FAILED');
        
        if (!updateSuccess) {
          allUpdatesSuccessful = false;
        }
        
        // Verify the update
        const [updatedProduct] = await db.promise().query(
          'SELECT id, name, stock FROM products WHERE id = ?',
          [item.product_id]
        );
        
        if (updatedProduct.length > 0) {
          console.log(`Product ${item.product_id} new stock: ${updatedProduct[0].stock} (was: ${item.stock}, change: ${updatedProduct[0].stock - item.stock})`);
        }
      }
      
      // Commit or rollback based on success
      if (allUpdatesSuccessful) {
        await db.promise().commit();
        console.log('Stock update transaction committed successfully');
      } else {
        await db.promise().rollback();
        console.log('Stock update transaction rolled back due to errors');
        
        // Log this for investigation
        console.error(`CRITICAL: Failed to update stock for directly refunded order #${orderId}. Manual intervention required.`);
      }
      
      console.log(`======= END OF DIRECT REFUND STOCK UPDATE DEBUG =======`);
    } catch (stockError) {
      console.error('Error restoring product stock after direct refund:', stockError);
      
      // Try to rollback if there was an error during the stock update transaction
      try {
        await db.promise().rollback();
        console.log('Stock update transaction rolled back after error');
      } catch (rollbackError) {
        console.error('Error rolling back stock update transaction:', rollbackError);
      }
      
      // Log this critical error for monitoring systems
      console.error(`CRITICAL ERROR: Failed to update stock for directly refunded order #${orderId}. Manual intervention required.`);
    }

    res.status(200).json({ message: 'Order refunded successfully' });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refund talep etme
router.post('/:orderId/request-refund', async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  
  console.log(`==== REQUEST REFUND DEBUG ====`);
  console.log(`Request refund for order ${orderId}`);
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);
  console.log('Refund reason:', reason);
  console.log(`=============================`);
  
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    // Siparişi getir (önce user id kontrolü ve delivered durumunda olduğunu kontrol et)
    const [orders] = await db.promise().query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Kullanıcının kendi siparişi mi kontrol et
    const userId = String(req.user.id);
    const orderUserId = String(order.user_id);
    
    if (userId !== orderUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only request refund for your own orders'
      });
    }
    
    // Sipariş durumunu kontrol et
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: 'Refund can only be requested for delivered orders'
      });
    }
    
    // Refund isteği oluştur
    const [updateResult] = await db.promise().query(
      'UPDATE orders SET status = ?, refund_reason = ? WHERE id = ?',
      ['refund-requested', reason || null, orderId]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Failed to update order status');
    }

    // Send email notification for refund request
    try {
      // Get order items
      const [items] = await db.promise().query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );

      // Send the email
      await sendOrderStatusEmail({
        to: order.email,
        name: order.name,
        orderId: order.id,
        status: 'refund-requested',
        orderDetails: {
          ...order,
          items: items || []
        },
        additionalInfo: reason
      });
    } catch (emailError) {
      console.error('Failed to send refund request email:', emailError);
      // Continue with response even if email fails
    }
    
    res.json({ 
      success: true, 
      message: 'Refund requested successfully' 
    });
    
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to request refund', 
      details: error.message 
    });
  }
});

// Refund talebini yönetme (onaylama/reddetme) - Sadece product manager
router.patch('/:orderId/manage-refund', async (req, res) => {
  const { orderId } = req.params;
  const { status, adminNote } = req.body;
  
  console.log(`===== MANAGE REFUND DEBUG =====`);
  console.log(`Managing refund for order ${orderId} - new status: ${status}`);
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  // Yalnızca product manager erişim kontrolü
  if (!req.user || req.user.role !== 'product_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only product managers can manage refund requests' 
    });
  }
  
  // Status kontrolü
  if (!['refund-approved', 'refund-denied'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid status. Must be refund-approved or refund-denied' 
    });
  }
  
  try {
    await db.promise().beginTransaction();

    // Siparişi getir
    const [orders] = await db.promise().query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (orders.length === 0) {
      await db.promise().rollback();
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const order = orders[0];
    console.log('Found order:', order);
    
    // Sipariş durumunu kontrol et
    if (order.status !== 'refund-requested') {
      await db.promise().rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Only refund-requested orders can be processed' 
      });
    }
    
    // Refund durumunu güncelle
    const [updateResult] = await db.promise().query(
      'UPDATE orders SET status = ?, admin_note = ? WHERE id = ?',
      [status, adminNote || null, orderId]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Failed to update refund status');
    }

    // Also update the refund_requests table
    const [refundRequests] = await db.promise().query(
      'SELECT * FROM refund_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );

    if (refundRequests.length > 0) {
      const refundStatus = status === 'refund-approved' ? 'approved' : 'rejected';
      await db.promise().query(
        'UPDATE refund_requests SET status = ?, approved_at = ? WHERE id = ?',
        [refundStatus, status === 'refund-approved' ? new Date() : null, refundRequests[0].id]
      );
    }
    
    // Commit the transaction for the order status update
    console.log(`Committing transaction for order #${orderId} refund status update to ${status}`);
    await db.promise().commit();
    console.log(`Transaction commit successful for order #${orderId}`);
    
    // If refund is approved, restore the product stock quantities
    // This is now done AFTER the transaction is committed to avoid any transaction issues
    if (status === 'refund-approved') {
      try {
        console.log(`\n======= REFUND APPROVAL STOCK UPDATE DEBUG (Order #${orderId}) =======`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`Order ID: ${orderId}, New Status: ${status}`);
        
        // Create a separate transaction for stock updates
        await db.promise().beginTransaction();
        console.log('Started separate transaction for stock updates');
        
        // Get order items with a direct query to ensure fresh data
        const [orderItems] = await db.promise().query(
          `SELECT oi.product_id, oi.quantity, p.name, p.stock
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?
           FOR UPDATE`,
          [orderId]
        );
        
        console.log(`Found ${orderItems.length} items to update stock for:`);
        console.log(JSON.stringify(orderItems, null, 2));
        
        if (orderItems.length === 0) {
          console.log('No items found for this order, nothing to update');
          await db.promise().rollback();
          console.log('Transaction rolled back (no items)');
        } else {
          // Flag to track if all updates succeeded
          let allUpdatesSuccessful = true;
          
          // Update stock for each item individually
          for (const item of orderItems) {
            const productId = item.product_id;
            const quantity = item.quantity;
            const currentStock = item.stock;
            
            console.log(`\n=> Processing item: ${item.name} (ID: ${productId})`);
            console.log(`   Current stock: ${currentStock}`);
            console.log(`   Will add quantity: ${quantity}`);
            console.log(`   Expected new stock: ${currentStock + quantity}`);
            
            // Update with a direct, simple query
            console.log('   Executing update query...');
            const updateQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
            const [updateResult] = await db.promise().query(updateQuery, [quantity, productId]);
            
            const updateSuccess = updateResult.affectedRows > 0;
            console.log(`   Query affected rows: ${updateResult.affectedRows}`);
            console.log(`   Update result: ${updateSuccess ? 'SUCCESS' : 'FAILED'}`);
            
            if (!updateSuccess) {
              console.error(`   CRITICAL: Failed to update stock for product ${productId}`);
              allUpdatesSuccessful = false;
            }
            
            // Verify the update with a fresh query
            const [updatedProduct] = await db.promise().query(
              'SELECT id, name, stock FROM products WHERE id = ?',
              [productId]
            );
            
            if (updatedProduct.length > 0) {
              const newStock = updatedProduct[0].stock;
              const stockChange = newStock - currentStock;
              
              console.log(`   Verification - New stock: ${newStock}`);
              console.log(`   Stock change: ${stockChange > 0 ? '+' + stockChange : stockChange}`);
              
              if (stockChange === quantity) {
                console.log('   ✅ STOCK UPDATED SUCCESSFULLY');
              } else {
                console.log(`   ⚠️ STOCK CHANGE (${stockChange}) DIFFERENT FROM EXPECTED (${quantity})`);
                
                // Try to update to the exact amount if automatic update didn't work
                if (stockChange !== quantity) {
                  console.log('   Attempting forced update to correct stock value...');
                  const forcedUpdateQuery = 'UPDATE products SET stock = ? WHERE id = ?';
                  const forcedNewStock = currentStock + quantity;
                  
                  const [forcedResult] = await db.promise().query(
                    forcedUpdateQuery, 
                    [forcedNewStock, productId]
                  );
                  
                  if (forcedResult.affectedRows > 0) {
                    console.log(`   ✅ FORCED UPDATE SUCCESSFUL - Stock set to ${forcedNewStock}`);
                  } else {
                    console.log('   ❌ FORCED UPDATE FAILED');
                    allUpdatesSuccessful = false;
                  }
                }
              }
            } else {
              console.log('   ❌ PRODUCT NOT FOUND DURING VERIFICATION');
              allUpdatesSuccessful = false;
            }
          }
          
          // Commit or rollback based on success
          if (allUpdatesSuccessful) {
            await db.promise().commit();
            console.log('\nStock update transaction COMMITTED SUCCESSFULLY');
          } else {
            await db.promise().rollback();
            console.log('\nStock update transaction ROLLED BACK due to errors');
            
            // Log this for investigation
            console.error(`CRITICAL: Failed to update stock for refund-approved order #${orderId}. Manual intervention required.`);
          }
        }
        
        console.log(`\n======= END OF REFUND APPROVAL STOCK UPDATE DEBUG =======`);
      } catch (stockError) {
        console.error('Error restoring product stock after refund:', stockError);
        
        // Try to rollback if there was an error during the stock update transaction
        try {
          await db.promise().rollback();
          console.log('Stock update transaction rolled back after error');
        } catch (rollbackError) {
          console.error('Error rolling back stock update transaction:', rollbackError);
        }
        
        // Log this critical error for monitoring systems
        console.error(`CRITICAL ERROR: Failed to update stock for refund-approved order #${orderId}. Manual intervention required.`);
      }
    }
    
    // Email gönder
    try {
      // Get order items
      const [items] = await db.promise().query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );

      // Send the email
      await sendOrderStatusEmail({
        to: order.email,
        name: order.name,
        orderId: order.id,
        status: status,
        orderDetails: {
          ...order,
          items: items || []
        },
        additionalInfo: adminNote
      });
      
      if (status === 'refund-approved') {
        console.log(`Refund approved email sent to ${order.email}`);
      } else if (status === 'refund-denied') {
        console.log(`Refund denied email sent to ${order.email}`);
      }
    } catch (emailError) {
      console.error('Error sending refund status email:', emailError);
      // Email gönderimi başarısız olsa bile işlemi tamamla
    }
    
    res.json({ 
      success: true, 
      message: `Refund ${status === 'refund-approved' ? 'approved' : 'denied'} successfully` 
    });
    
  } catch (error) {
    await db.promise().rollback().catch(rollbackErr => {
      console.error('Rollback error:', rollbackErr);
    });
    console.error('===== MANAGE REFUND ERROR =====');
    console.error('Error managing refund:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process refund request', 
      details: error.message 
    });
  }
});

// Test: Sahte teslim edilmiş siparişi döndür

>>>>>>> Stashed changes

module.exports = router; 