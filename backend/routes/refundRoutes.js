const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

// Refund isteği oluştur (sadece kullanıcı token ile erişebilir)
router.post("/request", verifyToken, async (req, res) => {
  const { order_id } = req.body;
  const user_id = req.user.id;

  try {
    // Siparişin gerçekten kullanıcıya ait ve 30 gün içinde teslim edilmiş olduğunu kontrol et
    const [orders] = await db.promise().query(
      `SELECT * FROM orders 
       WHERE id = ? AND user_id = ? AND status = 'delivered'
       AND DATEDIFF(NOW(), delivered_at) <= 30`,
      [order_id, user_id]
    );

    if (orders.length === 0) {
      return res.status(400).json({ error: "İade yapılamaz: Sipariş teslim edilmemiş ya da 30 gün geçmiş." });
    }

    // Zaten refund isteği olup olmadığını kontrol et
    const [existing] = await db.promise().query(
      `SELECT * FROM refund_requests WHERE order_id = ? AND user_id = ?`,
      [order_id, user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Bu sipariş için zaten iade isteği mevcut." });
    }

    // Refund isteğini oluştur
    await db.promise().query(
      `INSERT INTO refund_requests (order_id, user_id) VALUES (?, ?)`,
      [order_id, user_id]
    );

    res.json({ message: "İade isteği başarıyla oluşturuldu." });
  } catch (err) {
    console.error("Refund request error:", err);
    res.status(500).json({ error: "İade isteği sırasında hata oluştu." });
  }
});

// Refund onayla (admin erişimi varsayılır)
router.patch("/approve/:id", async (req, res) => {
  const refundId = req.params.id;

  try {
    const [refunds] = await db.promise().query("SELECT * FROM refund_requests WHERE id = ?", [refundId]);
    if (refunds.length === 0) {
      return res.status(404).json({ error: "İade isteği bulunamadı." });
    }

    // İade onaylanır
    await db.promise().query(
      `UPDATE refund_requests SET status = 'approved', approved_at = NOW() WHERE id = ?`,
      [refundId]
    );

    // Sipariş yeniden stoğa eklenmiş gibi yapılabilir, ayrıca kullanıcıya mail gönderilebilir (isteğe bağlı)

    res.json({ message: "İade onaylandı." });
  } catch (err) {
    console.error("Approve refund error:", err);
    res.status(500).json({ error: "İade onayı sırasında hata oluştu." });
  }
});

// Refund reddet
router.patch("/reject/:id", async (req, res) => {
  const refundId = req.params.id;

  try {
    const [refunds] = await db.promise().query("SELECT * FROM refund_requests WHERE id = ?", [refundId]);
    if (refunds.length === 0) {
      return res.status(404).json({ error: "İade isteği bulunamadı." });
    }

    await db.promise().query(
      `UPDATE refund_requests SET status = 'rejected' WHERE id = ?`,
      [refundId]
    );

    res.json({ message: "İade reddedildi." });
  } catch (err) {
    console.error("Reject refund error:", err);
    res.status(500).json({ error: "İade reddi sırasında hata oluştu." });
  }
});

module.exports = router;
