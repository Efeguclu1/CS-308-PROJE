const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const { sendOrderStatusEmail } = require("../utils/emailService");

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

    // Send email notification for refund request
    try {
      // Get order items
      const [items] = await db.promise().query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order_id]
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
      console.log(`Refund request email sent to ${order.email}`);
    } catch (emailError) {
      console.error('Failed to send refund request email:', emailError);
      // Continue with response even if email fails
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
router.patch("/approve/:id", async (req, res) => {
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
    
    if (orders.length > 0) {
      // Send email notification for refund approval
      try {
        const order = orders[0];
        
        // Get order items
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [refundRequest.order_id]
        );

        // Send the email
        await sendOrderStatusEmail({
          to: order.email,
          name: order.name,
          orderId: order.id,
          status: 'refund-approved',
          orderDetails: {
            ...order,
            items: items || []
          },
          additionalInfo: adminNote
        });
        console.log(`Refund approval email sent to ${order.email}`);
      } catch (emailError) {
        console.error('Failed to send refund approval email:', emailError);
        // Continue with response even if email fails
      }
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
router.patch("/reject/:id", async (req, res) => {
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
    
    if (orders.length > 0) {
      // Send email notification for refund denial
      try {
        const order = orders[0];
        
        // Get order items
        const [items] = await db.promise().query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [refundRequest.order_id]
        );

        // Send the email
        await sendOrderStatusEmail({
          to: order.email,
          name: order.name,
          orderId: order.id,
          status: 'refund-denied',
          orderDetails: {
            ...order,
            items: items || []
          },
          additionalInfo: adminNote
        });
        console.log(`Refund denial email sent to ${order.email}`);
      } catch (emailError) {
        console.error('Failed to send refund denial email:', emailError);
        // Continue with response even if email fails
      }
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
router.get("/order/:orderId", async (req, res) => {
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
