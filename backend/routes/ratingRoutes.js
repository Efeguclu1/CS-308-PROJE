const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { decrypt } = require('../utils/simpleEncryption');

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
    
    // Decrypt user names
    const decryptedRatings = ratings.map(rating => ({
      ...rating,
      user_name: decrypt(rating.user_name)
    }));
    
    // Calculate average rating
    const [avgRating] = await db.promise().query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count
       FROM ratings
       WHERE product_id = ?`,
      [productId]
    );
    
    res.json({
      ratings: decryptedRatings,
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
    
    // Decrypt user names
    const decryptedRatings = ratings.map(rating => ({
      ...rating,
      user_name: decrypt(rating.user_name)
    }));

    res.json(decryptedRatings);
  } catch (error) {
    console.error('Error fetching admin ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get all pending reviews across all products (for product manager)
router.get('/admin/pending', async (req, res) => {
  try {
    // Get all ratings with unapproved comments
    const [pendingReviews] = await db.promise().query(
      `SELECT r.*, u.name as user_name, p.name as product_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.comment IS NOT NULL AND r.comment_approved = 0
       ORDER BY r.created_at DESC`
    );
    
    // Decrypt user names
    const decryptedPendingReviews = pendingReviews.map(review => ({
      ...review,
      user_name: decrypt(review.user_name)
    }));

    res.json(decryptedPendingReviews);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

// Submit a new rating
router.post('/submit', async (req, res) => {
  const { userId, productId, rating, comment } = req.body;
  
  try {
    // First, check if the user has purchased this product at all
    const [purchaseCheck] = await db.promise().query(
      `SELECT oi.order_id 
       FROM order_items oi 
       JOIN orders o ON oi.order_id = o.id 
       WHERE o.user_id = ? AND oi.product_id = ? 
       LIMIT 1`,
      [userId, productId]
    );
    
    if (purchaseCheck.length === 0) {
      // User has not purchased this product
      return res.status(403).json({
        error: 'You can only rate products you have purchased'
      });
    }

    // If purchased, check if any of the orders for this product have been delivered
    const [deliveredCheck] = await db.promise().query(
      `SELECT o.id 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [userId, productId]
    );
    
    if (deliveredCheck.length === 0) {
      // User has purchased but the order is not yet delivered
      return res.status(403).json({
        error: 'You can only rate and comment on products after they have been delivered'
      });
    }
    
    // User has a delivered order for this product, proceed to insert rating
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
    // Get the rating to be approved to find user_id and product_id
    const [ratingToApprove] = await db.promise().query(
      `SELECT user_id, product_id FROM ratings WHERE id = ?`,
      [ratingId]
    );

    if (ratingToApprove.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    const { user_id, product_id } = ratingToApprove[0];

    // Deactivate previous approved comments for the same user and product
    // We'll set comment_approved to 2 (or another value indicating deactivated)
    await db.promise().query(
      `UPDATE ratings 
       SET comment_approved = 2 
       WHERE user_id = ? AND product_id = ? AND id != ? AND comment_approved = 1`,
      [user_id, product_id, ratingId]
    );

    // Approve the current comment
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