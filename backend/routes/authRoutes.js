const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Kullanıcı Kaydı (Register)
router.post("/register", async (req, res) => {
  const { name, email, password, address } = req.body;

  if (!name || !email || !password || !address) {
    return res.status(400).json({ error: "Tüm alanlar gereklidir." });
  }

  try {
    // Check if email already exists (case insensitive)
    const [existingUsers] = await db.promise().query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", 
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Bu email adresi zaten kullanımda." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save with original email case for proper delivery
    await db.promise().query(
      "INSERT INTO users (name, email, password, address) VALUES (?, ?, ?, ?)", 
      [name, email, hashedPassword, address]
    );
    
    console.log(`User registered with email: ${email}`);
    res.json({ message: "Kullanıcı başarıyla kaydedildi." });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Kayıt başarısız." });
  }
});

// Kullanıcı Girişi (Login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Tüm alanlar gereklidir." });
  }

  try {
    // Find user by email (case insensitive)
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", 
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Yanlış şifre" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: "1h" });

    console.log(`User logged in: ${user.email} (original case preserved)`);
    res.json({ 
      message: "Giriş başarılı", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email, // Preserved original case from database
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
