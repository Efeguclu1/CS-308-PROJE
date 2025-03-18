const db = require("../config/db");

// Get all ratings for a product
const getProductRatings = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeUnapproved } = req.query;
    
    // Default query only returns approved comments
    let query = `
      SELECT r.*, u.name as user_name 
      FROM ratings r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.product_id = ?
    `;
    
    // Add condition for approved comments unless includeUnapproved is set
    if (includeUnapproved !== 'true') {
      query += ' AND r.comment_approved = 1';
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const [ratings] = await db.query(query, [productId]);
    res.json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ message: "Error fetching ratings" });
  }
};

// Add a new rating and comment
const addRating = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id; // From auth middleware

    console.log("Adding rating:", { userId, productId, rating, comment });

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const [productCheck] = await db.query("SELECT * FROM products WHERE id = ?", [productId]);
    
    if (productCheck.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product found:", productCheck[0]);

    const query = `
      INSERT INTO ratings (user_id, product_id, rating, comment, comment_approved)
      VALUES (?, ?, ?, ?, 0)
    `;
    
    console.log("Executing query:", query);
    console.log("With parameters:", [userId, productId, rating, comment]);

    const [result] = await db.query(query, [userId, productId, rating, comment]);
    console.log("Query result:", result);
    
    res.status(201).json({ message: "Rating added successfully" });
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({ message: "Error adding rating", error: error.message });
  }
};

// Update a rating
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if rating exists and belongs to user
    const [existingRating] = await db.query(
      "SELECT * FROM ratings WHERE id = ? AND user_id = ?",
      [ratingId, userId]
    );

    if (existingRating.length === 0) {
      return res.status(404).json({ message: "Rating not found or unauthorized" });
    }

    const query = `
      UPDATE ratings 
      SET rating = ?, comment = ?, comment_approved = 0
      WHERE id = ? AND user_id = ?
    `;
    
    await db.query(query, [rating, comment, ratingId, userId]);
    res.json({ message: "Rating updated successfully" });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({ message: "Error updating rating" });
  }
};

// Delete a rating
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;

    // Check if rating exists and belongs to user
    const [existingRating] = await db.query(
      "SELECT * FROM ratings WHERE id = ? AND user_id = ?",
      [ratingId, userId]
    );

    if (existingRating.length === 0) {
      return res.status(404).json({ message: "Rating not found or unauthorized" });
    }

    await db.query("DELETE FROM ratings WHERE id = ? AND user_id = ?", [ratingId, userId]);
    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({ message: "Error deleting rating" });
  }
};

// Approve a comment (for product managers)
const approveComment = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userRole = req.user.role;

    if (userRole !== 'product_manager') {
      return res.status(403).json({ message: "Unauthorized to approve comments" });
    }

    const query = "UPDATE ratings SET comment_approved = 1 WHERE id = ?";
    await db.query(query, [ratingId]);
    res.json({ message: "Comment approved successfully" });
  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({ message: "Error approving comment" });
  }
};

module.exports = {
  getProductRatings,
  addRating,
  updateRating,
  deleteRating,
  approveComment
}; 