const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getProductRatings,
  addRating,
  updateRating,
  deleteRating,
  approveComment
} = require("../controllers/ratingController");

// Get all ratings for a product
router.get("/product/:productId", getProductRatings);

// Add a new rating (requires authentication)
router.post("/", auth, addRating);

// Update a rating (requires authentication)
router.put("/:ratingId", auth, updateRating);

// Delete a rating (requires authentication)
router.delete("/:ratingId", auth, deleteRating);

// Approve a comment (requires product manager role)
router.put("/:ratingId/approve", auth, approveComment);

module.exports = router; 