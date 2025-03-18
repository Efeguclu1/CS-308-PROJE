const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Kullanıcı Kaydı (Register)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!name || !email || !password || !address) {
      return res.status(400).json({ error: "Tüm alanlar gereklidir." });
    }

    // Validate role if provided
    const validRoles = ['customer', 'product_manager', 'sales_manager'];
    const userRole = role && validRoles.includes(role) ? role : 'customer';

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)";
    
    const [result] = await db.query(query, [name, email, hashedPassword, address, userRole]);
    
    res.json({ message: "Kullanıcı başarıyla kaydedildi." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Kayıt başarısız." });
  }
});

// Kullanıcı Girişi (Login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Tüm alanlar gereklidir." });
    }

    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    
    if (results.length === 0) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Yanlış şifre" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.json({ message: "Giriş başarılı", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
