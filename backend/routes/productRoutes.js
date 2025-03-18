const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { auth } = require("../middleware/auth");

// Tüm ürünleri getir
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM products");
    res.json(results);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Ürünleri getirirken hata oluştu." });
  }
});

// Yeni ürün ekle (requires product_manager role)
router.post("/", auth, async (req, res) => {
  try {
    const { name, model, serial_number, description, stock, price, warranty_months, distributor_info, category_id } = req.body;
    
    // Only product managers can add products
    if (req.user.role !== 'product_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmuyor." });
    }

    // For testing purposes, let's allow product creation without a category
    const query = `
      INSERT INTO products 
      (name, model, serial_number, description, stock, price, warranty_months, distributor_info, category_id, visible) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    const [result] = await db.query(query, 
      [name, model, serial_number, description, stock, price, warranty_months, distributor_info, category_id]
    );
    
    res.status(201).json({ message: "Ürün başarıyla eklendi.", productId: result.insertId });
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: "Ürün eklenirken hata oluştu." });
  }
});

// For testing, add a simple product without auth
router.post("/test", async (req, res) => {
  try {
    // Create a simple test product
    const query = `
      INSERT INTO products 
      (name, description, stock, price, warranty_months, visible) 
      VALUES (?, ?, ?, ?, ?, 1)
    `;
    
    const [result] = await db.query(query, 
      ["Test Product", "This is a test product", 10, 99.99, 12]
    );
    
    res.status(201).json({ message: "Test ürünü başarıyla eklendi.", productId: result.insertId });
  } catch (err) {
    console.error("Test product creation error:", err);
    res.status(500).json({ error: "Test ürünü eklenirken hata oluştu." });
  }
});

module.exports = router;
