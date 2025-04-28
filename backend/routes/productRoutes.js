const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all products
router.get("/", (req, res) => {
  const { sort } = req.query;
  
  console.log('Sorting parameter received:', sort);
  let query = "SELECT * FROM products WHERE visible = 1";
  
  if (sort === 'popularity') {
    query += " ORDER BY popularity DESC";
    console.log('Applying popularity sorting');
  }
  
  console.log('Final query:', query);
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving products." });
    }
    console.log(`Returned ${results.length} products`);
    res.json(results);
  });
});

// Get all categories
router.get("/categories/all", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving categories." });
    }
    res.json(results);
  });
});

// Get products by category
router.get("/category/:categoryId", (req, res) => {
  const categoryId = req.params.categoryId;
  const { sort } = req.query;
  
  let query = "SELECT * FROM products WHERE category_id = ? AND visible = 1";
  
  if (sort === 'popularity') {
    query += " ORDER BY popularity DESC";
  }
  
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving products by category." });
    }
    res.json(results);
  });
});

// Search products
router.get("/search/:query", (req, res) => {
  const searchQuery = `%${req.params.query}%`;
  const { sort } = req.query;
  
  let query = "SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR model LIKE ?) AND visible = 1";
  
  if (sort === 'popularity') {
    query += " ORDER BY popularity DESC";
  }
  
  db.query(
    query,
    [searchQuery, searchQuery, searchQuery],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error searching products." });
      }
      res.json(results);
    }
  );
});

// Get latest products
router.get("/latest/:limit", (req, res) => {
  const limit = parseInt(req.params.limit) || 4;
  const query = "SELECT * FROM products WHERE visible = 1 ORDER BY id DESC LIMIT ?";
  
  console.log(`Fetching latest ${limit} products`);
  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving latest products." });
    }
    console.log(`Returned ${results.length} latest products`);
    res.json(results);
  });
});

// Get products with most recent ratings
router.get("/most-recently-rated/:limit", (req, res) => {
  const limit = parseInt(req.params.limit) || 4;
  
  // Query to get products with most recent ratings
  const query = `
    SELECT p.*, MAX(r.created_at) as latest_rating_date 
    FROM products p
    JOIN ratings r ON p.id = r.product_id
    WHERE p.visible = 1 AND r.comment_approved = 1
    GROUP BY p.id
    ORDER BY latest_rating_date DESC
    LIMIT ?
  `;
  
  console.log(`Fetching ${limit} most recently rated products`);
  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: "Error retrieving recently rated products." });
    }
    console.log(`Returned ${results.length} recently rated products`);
    res.json(results);
  });
});

// Get product by ID - this generic route should be last
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  db.query("SELECT * FROM products WHERE id = ? AND visible = 1", [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving product." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json(results[0]);
  });
});

module.exports = router;
