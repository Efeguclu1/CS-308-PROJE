const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Tüm ürünleri getir
router.get("/", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Ürünleri getirirken hata oluştu." });
    }
    res.json(results);
  });
});

module.exports = router;
