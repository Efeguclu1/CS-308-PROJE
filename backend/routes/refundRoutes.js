const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

// Refund isteği oluştur (sadece kullanıcı token ile erişebilir)
router.post("/request", verifyToken, async (req, res) => {
  const { order_id } = req.body;
  const user_id = req.user.id;
  const reason = req.body.reason || null;

  try {
    // Siparişin gerçekten kullanıcıya ait ve 30 gün içinde teslim edilmiş olduğunu kontrol et
    const [orders] = await db.promise().query(
      `SELECT o.*, u.name, u.email 
       FROM orders o
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ? AND o.user_id = ? AND o.status = 'delivered'
       AND DATEDIFF(NOW(), o.delivered_at) <= 30`,
      [order_id, user_id]
    );

    if (orders.length === 0) {
      return res.status(400).json({ error: "İade yapılamaz: Sipariş teslim edilmemiş ya da 30 gün geçmiş." });
    }

    const order = orders[0];

    // Zaten refund isteği olup olmadığını kontrol et
    const [existing] = await db.promise().query(
      `SELECT * FROM orders WHERE id = ? AND status LIKE 'refund-%'`,
      [order_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Bu sipariş için zaten iade isteği mevcut." });
    }

    // Transaction başlat
    await db.promise().beginTransaction();

    // Refund isteğini oluştur
    await db.promise().query(
      `INSERT INTO refund_requests (order_id, user_id, reason) VALUES (?, ?, ?)`,
      [order_id, user_id, reason]
    );

    // Sipariş durumunu güncelle
    await db.promise().query(
      `UPDATE orders SET status = 'refund-requested', refund_reason = ? WHERE id = ?`,
      [reason, order_id]
    );



    // Create notification for the user
    try {
      const notificationMessage = `Your refund request for Order #${order_id} has been submitted and is being reviewed. You will be notified when a decision is made.`;
      const notificationMetadata = JSON.stringify({
        order_id: order_id,
        type: 'refund_requested',
        reason: reason || null
      });

      await db.promise().query(
        `INSERT INTO notifications (user_id, type, message, metadata)
         VALUES (?, ?, ?, ?)`,
        [user_id, 'refund_requested', notificationMessage, notificationMetadata]
      );
      console.log(`Created refund request notification for user ID ${user_id}`);
    } catch (notificationError) {
      console.error('Error creating refund request notification:', notificationError);
      // Don't fail the refund if notification creation fails
    }

    // Transaction tamamla
    await db.promise().commit();

    res.json({ message: "İade isteği başarıyla oluşturuldu." });
  } catch (err) {
    // Hata durumunda transaction geri al
    await db.promise().rollback().catch(rollbackErr => {
      console.error("Rollback error:", rollbackErr);
    });
    console.error("Refund request error:", err);
    res.status(500).json({ error: "İade isteği sırasında hata oluştu." });
  }
});

// Refund onayla (admin erişimi varsayılır)
router.patch("/approve/:id", verifyToken, async (req, res) => {
  // Check if user is sales manager
  if (!req.user || req.user.role !== 'sales_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only sales managers can approve refunds' 
    });
  }
  const refundId = req.params.id;
  const { adminNote } = req.body;
  console.log(`===== REFUND APPROVE DEBUG =====`);
  console.log(`Approving refund ID: ${refundId}`);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);

  try {
    // Transaction başlat
    await db.promise().beginTransaction();

    // Refund kaydını getir
    const [refunds] = await db.promise().query(
      "SELECT * FROM refund_requests WHERE id = ?", 
      [refundId]
    );
    
    console.log('Found refund request:', refunds[0] || 'None');
    
    if (refunds.length === 0) {
      await db.promise().rollback();
      return res.status(404).json({ error: "İade isteği bulunamadı." });
    }
    
    const refundRequest = refunds[0];

    // İade onaylanır
    await db.promise().query(
      `UPDATE refund_requests SET status = 'approved', approved_at = NOW() WHERE id = ?`,
      [refundId]
    );
    
    // Sipariş durumunu güncelle
    await db.promise().query(
      `UPDATE orders SET status = 'refund-approved', admin_note = ? WHERE id = ?`,
      [adminNote || null, refundRequest.order_id]
    );

    // Get order and user details for email
    const [orders] = await db.promise().query(
      `SELECT o.*, u.name, u.email 
       FROM orders o
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [refundRequest.order_id]
    );
    
    // Get order items to restore product stock
    const [orderItems] = await db.promise().query(
      `SELECT oi.*, p.name, p.stock
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [refundRequest.order_id]
    );
    
    console.log(`Found ${orderItems.length} items to update stock for refund approval`);
    
    // Update stock for each item in the order
    let stockUpdateSuccess = true;
    for (const item of orderItems) {
      console.log(`Updating stock for product ${item.product_id} (${item.name}), current stock: ${item.stock}, adding: ${item.quantity}`);
      
      // Lock the product row for update
      const [currentProductData] = await db.promise().query(
        'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      
      if (currentProductData.length === 0) {
        console.error(`Product ${item.product_id} not found!`);
        stockUpdateSuccess = false;
        continue;
      }
      
      // Increase stock (add the refunded quantity back)
      const updateQuery = 'UPDATE products SET stock = stock + ? WHERE id = ?';
      const [updateResult] = await db.promise().query(updateQuery, [item.quantity, item.product_id]);
      
      if (updateResult.affectedRows === 0) {
        console.error(`Failed to update stock for product ${item.product_id}`);
        stockUpdateSuccess = false;
      }
      
      // Verify the update
      const [updatedProduct] = await db.promise().query(
        'SELECT id, name, stock FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (updatedProduct.length > 0) {
        console.log(`Product ${item.product_id} new stock: ${updatedProduct[0].stock} (was: ${item.stock}, change: +${item.quantity})`);
      }
    }
    
    if (!stockUpdateSuccess) {
      console.error(`CRITICAL: Some product stock updates failed for refund ${refundId}. Manual intervention may be required.`);
      // Continue with the refund process despite stock update issues
    }
    


    // Create notification for the user
    try {
      const notificationMessage = `Your refund request for Order #${refundRequest.order_id} has been approved. The refund will be processed to your original payment method.`;
      const notificationMetadata = JSON.stringify({
        order_id: refundRequest.order_id,
        refund_id: refundId,
        type: 'refund_approved',
        admin_note: adminNote || null
      });

      await db.promise().query(
        `INSERT INTO notifications (user_id, type, message, metadata)
         VALUES (?, ?, ?, ?)`,
        [refundRequest.user_id, 'refund_approved', notificationMessage, notificationMetadata]
      );
      console.log(`Created refund approval notification for user ID ${refundRequest.user_id}`);
    } catch (notificationError) {
      console.error('Error creating refund approval notification:', notificationError);
      // Don't fail the refund if notification creation fails
    }

    // Transaction tamamla
    await db.promise().commit();
    console.log('Refund successfully approved for order:', refundRequest.order_id);

    res.json({ 
      success: true,
      message: "İade onaylandı.", 
      refund_id: refundId,
      order_id: refundRequest.order_id 
    });
  } catch (err) {
    // Hata durumunda transaction geri al
    await db.promise().rollback().catch(rollbackErr => {
      console.error("Rollback error:", rollbackErr);
    });
    console.error(`===== REFUND APPROVE ERROR =====`);
    console.error("Approve refund error:", err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
    res.status(500).json({ error: "İade onayı sırasında hata oluştu." });
  }
});

// Refund reddet
router.patch("/reject/:id", verifyToken, async (req, res) => {
  // Check if user is sales manager
  if (!req.user || req.user.role !== 'sales_manager') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only sales managers can reject refunds' 
    });
  }
  const refundId = req.params.id;
  const { adminNote } = req.body;
  console.log(`===== REFUND REJECT DEBUG =====`);
  console.log(`Rejecting refund ID: ${refundId}`);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);

  try {
    // Transaction başlat
    await db.promise().beginTransaction();

    // Refund kaydını getir
    const [refunds] = await db.promise().query(
      "SELECT * FROM refund_requests WHERE id = ?", 
      [refundId]
    );
    
    console.log('Found refund request:', refunds[0] || 'None');
    
    if (refunds.length === 0) {
      await db.promise().rollback();
      return res.status(404).json({ error: "İade isteği bulunamadı." });
    }
    
    const refundRequest = refunds[0];

    // İade reddedilir
    await db.promise().query(
      `UPDATE refund_requests SET status = 'rejected' WHERE id = ?`,
      [refundId]
    );
    
    // Sipariş durumunu güncelle
    await db.promise().query(
      `UPDATE orders SET status = 'refund-denied', admin_note = ? WHERE id = ?`,
      [adminNote || null, refundRequest.order_id]
    );

    // Get order and user details for email
    const [orders] = await db.promise().query(
      `SELECT o.*, u.name, u.email 
       FROM orders o
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [refundRequest.order_id]
    );
    


    // Create notification for the user
    try {
      const notificationMessage = `Your refund request for Order #${refundRequest.order_id} has been denied.${adminNote ? ` Reason: ${adminNote}` : ''}`;
      const notificationMetadata = JSON.stringify({
        order_id: refundRequest.order_id,
        refund_id: refundId,
        type: 'refund_denied',
        admin_note: adminNote || null
      });

      await db.promise().query(
        `INSERT INTO notifications (user_id, type, message, metadata)
         VALUES (?, ?, ?, ?)`,
        [refundRequest.user_id, 'refund_denied', notificationMessage, notificationMetadata]
      );
      console.log(`Created refund denial notification for user ID ${refundRequest.user_id}`);
    } catch (notificationError) {
      console.error('Error creating refund denial notification:', notificationError);
      // Don't fail the refund if notification creation fails
    }

    // Transaction tamamla
    await db.promise().commit();
    console.log('Refund successfully rejected for order:', refundRequest.order_id);

    res.json({
      success: true,
      message: "İade reddedildi.",
      refund_id: refundId,
      order_id: refundRequest.order_id
    });
  } catch (err) {
    // Hata durumunda transaction geri al
    await db.promise().rollback().catch(rollbackErr => {
      console.error("Rollback error:", rollbackErr);
    });
    console.error(`===== REFUND REJECT ERROR =====`);
    console.error("Reject refund error:", err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
    res.status(500).json({ error: "İade reddi sırasında hata oluştu." });
  }
});

// Get refund request by order ID
router.get("/order/:orderId", verifyToken, async (req, res) => {
  // Check if user is sales manager or is the order owner
  if (!req.user || (req.user.role !== 'sales_manager' && req.user.role !== 'customer')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized. Only sales managers or order owners can access refund details' 
    });
  }
  const { orderId } = req.params;
  console.log(`Fetching refund request for order ID: ${orderId}`);

  try {
    // Get the most recent refund request for this order
    const [refunds] = await db.promise().query(
      "SELECT * FROM refund_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1",
      [orderId]
    );

    if (refunds.length === 0) {
      return res.status(404).json({ error: "No refund request found for this order" });
    }

    const refundRequest = refunds[0];
    console.log(`Found refund request:`, refundRequest);

    res.json(refundRequest);
  } catch (err) {
    console.error("Error fetching refund request:", err);
    res.status(500).json({ error: "Failed to fetch refund request" });
  }
});

module.exports = router;
