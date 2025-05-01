const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

// All discount routes require authentication
router.use(verifyToken);

// Get all discounts
router.get('/', async (req, res) => {
  if (!req.user || req.user.role !== 'sales_manager') {
    return res.status(403).json({ error: 'Only sales managers can view discounts' });
  }

  try {
    const [discounts] = await db.promise().query(`
      SELECT d.*, p.name as product_name, p.price as original_price
      FROM discounts d
      JOIN products p ON d.product_id = p.id
      ORDER BY d.created_at DESC
    `);
    res.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

// Create new discount
router.post('/', async (req, res) => {
  if (!req.user || req.user.role !== 'sales_manager') {
    return res.status(403).json({ error: 'Only sales managers can create discounts' });
  }

  const { product_id, discount_type, discount_value, start_date, end_date } = req.body;

  try {
    // Check if product exists
    const [products] = await db.promise().query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if there's already an active discount for this product
    const [existingDiscounts] = await db.promise().query(`
      SELECT * FROM discounts 
      WHERE product_id = ? 
      AND (
        (start_date <= ? AND end_date >= ?) OR
        (start_date <= ? AND end_date >= ?)
      )
    `, [product_id, start_date, start_date, end_date, end_date]);

    if (existingDiscounts.length > 0) {
      return res.status(400).json({ error: 'There is already a discount for this product in the specified date range' });
    }

    const [result] = await db.promise().query(
      `INSERT INTO discounts (product_id, discount_type, discount_value, start_date, end_date, is_active) 
       VALUES (?, ?, ?, ?, ?, true)`,
      [product_id, discount_type, discount_value, start_date, end_date]
    );

    const [newDiscount] = await db.promise().query(`
      SELECT d.*, p.name as product_name, p.price as original_price
      FROM discounts d
      JOIN products p ON d.product_id = p.id
      WHERE d.id = ?
    `, [result.insertId]);

    res.status(201).json(newDiscount[0]);
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ error: 'Failed to create discount' });
  }
});

// Delete discount
router.delete('/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'sales_manager') {
    return res.status(403).json({ error: 'Only sales managers can delete discounts' });
  }

  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM discounts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ error: 'Failed to delete discount' });
  }
});

// Get discounted price for a product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const [discounts] = await db.promise().query(`
      SELECT d.*, p.price as original_price
      FROM discounts d
      JOIN products p ON d.product_id = p.id
      WHERE d.product_id = ? 
      AND NOW() BETWEEN d.start_date AND d.end_date
      ORDER BY d.created_at DESC
      LIMIT 1
    `, [productId]);

    if (discounts.length === 0) {
      return res.json({ hasDiscount: false });
    }

    const discount = discounts[0];
    let discountedPrice = discount.original_price;

    if (discount.discount_type === 'percentage') {
      discountedPrice = discount.original_price * (1 - discount.discount_value / 100);
    } else {
      discountedPrice = Math.max(0, discount.original_price - discount.discount_value);
    }

    res.json({
      hasDiscount: true,
      originalPrice: discount.original_price,
      discountedPrice: discountedPrice,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      endDate: discount.end_date
    });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({ error: 'Failed to calculate discount' });
  }
});

module.exports = router; 