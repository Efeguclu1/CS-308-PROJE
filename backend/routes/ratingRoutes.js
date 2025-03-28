const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get approved ratings and all ratings for a specific product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    // Get approved comments and all ratings
    const [ratings] = await db.promise().query(
      `SELECT r.*, u.name as user_name 
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND (r.comment_approved = 1 OR r.comment IS NULL OR r.comment = '')
       ORDER BY r.created_at DESC`,
      [productId]
    );
    
    // Calculate average rating
    const [avgRating] = await db.promise().query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count
       FROM ratings
       WHERE product_id = ?`,
      [productId]
    );
    
    res.json({
      ratings,
      stats: {
        averageRating: avgRating[0].average_rating || 0,
        ratingCount: avgRating[0].rating_count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get all ratings (including unapproved) for product manager
router.get('/admin/product/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    // Get all ratings and comments including unapproved ones
    const [ratings] = await db.promise().query(
      `SELECT r.*, u.name as user_name 
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching admin ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Submit a new rating
router.post('/submit', async (req, res) => {
  const { userId, productId, rating, comment } = req.body;
  
  try {
    // Check if user has purchased this product
    const [orders] = await db.promise().query(
      `SELECT o.id 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? AND oi.product_id = ?
       LIMIT 1`,
      [userId, productId]
    );
    
    if (orders.length === 0) {
      return res.status(403).json({ 
        error: 'You can only rate products you have purchased' 
      });
    }
    
    // Check if user has already rated this product
    const [existingRating] = await db.promise().query(
      `SELECT id FROM ratings WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );
    
    if (existingRating.length > 0) {
      // Update existing rating
      await db.promise().query(
        `UPDATE ratings 
         SET rating = ?, comment = ?, comment_approved = ? 
         WHERE user_id = ? AND product_id = ?`,
        [rating, comment, comment ? 0 : null, userId, productId]
      );
      
      return res.json({ 
        success: true, 
        message: 'Rating updated successfully. Your comment will be visible after approval.' 
      });
    }
    
    // Insert new rating
    await db.promise().query(
      `INSERT INTO ratings (user_id, product_id, rating, comment, comment_approved) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, productId, rating, comment, comment ? 0 : null]
    );
    
    res.json({ 
      success: true, 
      message: 'Thank you for your rating. Your comment will be visible after approval.' 
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Approve a comment (product manager only)
router.put('/approve/:ratingId', async (req, res) => {
  const { ratingId } = req.params;
  
  try {
    await db.promise().query(
      `UPDATE ratings SET comment_approved = 1 WHERE id = ?`,
      [ratingId]
    );
    
    res.json({ success: true, message: 'Comment approved successfully' });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

// Reject/delete a comment (product manager only)
router.delete('/:ratingId', async (req, res) => {
  const { ratingId } = req.params;
  
  try {
    // Instead of deleting, we'll set the comment to null but keep the rating
    await db.promise().query(
      `UPDATE ratings SET comment = NULL, comment_approved = NULL WHERE id = ?`,
      [ratingId]
    );
    
    res.json({ success: true, message: 'Comment removed successfully' });
  } catch (error) {
    console.error('Error removing comment:', error);
    res.status(500).json({ error: 'Failed to remove comment' });
  }
});

module.exports = router; 