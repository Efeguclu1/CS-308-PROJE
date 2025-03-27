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

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query("INSERT INTO users (name, email, password, address) VALUES (?, ?, ?, ?)", 
    [name, email, hashedPassword, address], 
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "Bu email adresi zaten kullanımda." });
        }
        return res.status(500).json({ error: "Kayıt başarısız." });
      }
      res.json({ message: "Kullanıcı başarıyla kaydedildi." });
    }
  );
});

// Kullanıcı Girişi (Login)
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Tüm alanlar gereklidir." });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Sunucu hatası" });
    
    if (results.length === 0) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Yanlış şifre" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: "1h" });

    res.json({ 
      message: "Giriş başarılı", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;
