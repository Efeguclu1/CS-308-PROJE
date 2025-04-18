const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all products
router.get("/", (req, res) => {
  db.query("SELECT * FROM products WHERE visible = 1", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving products." });
    }
    res.json(results);
  });
});

// Get product by ID
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

// Get products by category
router.get("/category/:categoryId", (req, res) => {
  const categoryId = req.params.categoryId;
  db.query("SELECT * FROM products WHERE category_id = ? AND visible = 1", [categoryId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error retrieving products by category." });
    }
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

// Search products
router.get("/search/:query", (req, res) => {
  const searchQuery = `%${req.params.query}%`;
  db.query(
    "SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR model LIKE ?) AND visible = 1",
    [searchQuery, searchQuery, searchQuery],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error searching products." });
      }
      res.json(results);
    }
  );
});

module.exports = router;
