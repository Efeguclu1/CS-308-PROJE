const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { 
  sendOrderInTransitEmail, 
  sendOrderDeliveredEmail, 
  sendOrderCancelledEmail,
  sendOrderStatusEmail 
} = require('../utils/emailService');
const { decrypt } = require('../utils/simpleEncryption');

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
      SELECT o.*, u.name AS user_name, 
             o.delivery_address
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
    
    // Decrypt user names and get order items for each order
    const ordersWithItems = [];
    
    for (const order of orders) {
      try {
        // Decrypt the user_name
        const decryptedUserName = decrypt(order.user_name);

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
          user_name: decryptedUserName, // Use the decrypted name
          full_address: order.delivery_address,
          items: items || []
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        ordersWithItems.push({
          ...order,
          // If item fetching fails, still include the decrypted username
          user_name: decrypt(order.user_name),
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
  const { status, adminNote } = req.body;
  
  console.log(`Updating order ${orderId} status to ${status}`);
  console.log('User from token:', req.user);
  
  // Check if user is admin or product manager
  if (!req.user || req.user.role !== 'product_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only product managers can update order status' 
    });
  }
  
  if (!['processing', 'in-transit', 'delivered', 'cancelled', 'refund-requested', 'refund-approved', 'refund-denied'].includes(status)) {
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
    // Decrypt user's email and name from the database
    const userEmail = decrypt(order.email);
    const userName = decrypt(order.name);
    const previousStatus = order.status;
    
    // If status is 'delivered', also update the delivered_at timestamp
    let query = '';
    const params = [];
    
    if (status === 'delivered') {
      // Include admin_note if provided
      if (adminNote) {
        query = 'UPDATE orders SET status = ?, delivered_at = NOW(), admin_note = ? WHERE id = ?';
        params.push(status, adminNote, orderId);
      } else {
        query = 'UPDATE orders SET status = ?, delivered_at = NOW() WHERE id = ?';
        params.push(status, orderId);
      }
    } else {
      // Include admin_note if provided
      if (adminNote) {
        query = 'UPDATE orders SET status = ?, admin_note = ? WHERE id = ?';
        params.push(status, adminNote, orderId);
      } else {
        query = 'UPDATE orders SET status = ? WHERE id = ?';
        params.push(status, orderId);
      }
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
          to: userEmail,
          name: userName,
          orderId: order.id,
          status: status,
          orderDetails: {
            ...order,
            items: items || []
          }
        });
        
        console.log(`Status update email sent to ${userEmail} for order #${orderId}`);
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
    
    const order = orders[0];
    // Decrypt user's email and name from the database
    const userEmail = decrypt(order.email);
    const userName = decrypt(order.name);
    const previousStatus = order.status;
    
    console.log('Order details:', order);
    console.log('User email (decrypted):', userEmail);
    
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
    
    // Get order items for the email
    const [items] = await db.promise().query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );
    
    // Send cancellation email using new combined email method
    try {
      console.log(`Sending cancellation email to ${userEmail}`);
      // Use the newer combined email service
      await sendOrderStatusEmail({
        to: userEmail,
        name: userName,
        orderId: order.id,
        status: 'cancelled',
        orderDetails: {
          total_amount: order.total_amount,
          items: items || []
        },
        additionalInfo: req.body.cancellation_reason || 'Customer requested cancellation'
      });
      console.log(`Cancellation email sent to ${userEmail} for order #${orderId}`);
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      console.error('Email error details:', emailError.message);
      // We don't want to fail the request if email sending fails
      // Just log the error and continue
    }
    
    console.log('Order cancelled successfully');
    await db.promise().commit();
    
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
      
      // Decrypt user's email and name
      const userEmail = decrypt(user.email);
      const userName = decrypt(user.name);
      
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
          to: userEmail,
          name: userName,
          orderId: order.id,
          status: 'refund-requested',
          orderDetails: {
            total_amount: order.total_amount,
            items: items || []
          },
          additionalInfo: reason || 'No reason provided'
        });
        
        console.log(`Refund request email sent to ${userEmail}`);
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

// Test: Sahte teslim edilmiş siparişi döndür

module.exports = router; 