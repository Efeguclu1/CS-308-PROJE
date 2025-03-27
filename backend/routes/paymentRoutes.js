const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ödeme işlemini gerçekleştir
router.post('/process', async (req, res) => {
  const connection = await db.promise();
  
  try {
    const { cardNumber, cardName, expirationMonth, expirationYear, cvv, userId, items, totalAmount } = req.body;

    // Validate payment information
    if (!cardNumber || !cardName || !expirationMonth || !expirationYear || !cvv) {
      return res.status(400).json({ success: false, error: 'Missing payment information' });
    }

    // Validate card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      return res.status(400).json({ success: false, error: 'Card number must be 16 digits' });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items in order' });
    }

    // Get user's address
    const [userResult] = await connection.query(
      'SELECT address FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    // Transaction başlat
    await connection.beginTransaction();

    try {
      // Create order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_amount, status, delivery_address) VALUES (?, ?, ?, ?)',
        [userId, totalAmount, 'processing', userResult[0].address]
      );
      const orderId = orderResult.insertId;

      // Add order items and update stock
      for (const item of items) {
        // Check stock
        const [stockResult] = await connection.query(
          'SELECT stock FROM products WHERE id = ?',
          [item.productId]
        );

        if (!stockResult[0]) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (stockResult[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.productId}`);
        }

        // Add order item
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.productId, item.quantity, item.price]
        );

        // Update stock
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }

      // Transaction'ı onayla
      await connection.commit();
      
      // Başarılı response
      res.json({ 
        success: true, 
        orderId,
        message: 'Order placed successfully'
      });

    } catch (error) {
      // Hata durumunda transaction'ı geri al
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to process payment'
    });
  }
});

module.exports = router; 