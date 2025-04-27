const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

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

    // Include the user role in the token payload
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: "1h" }
    );

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

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, address, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user from database
    const [users] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // If changing password, verify current password
    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.promise().query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    }

    // Update user profile
    await db.promise().query(
      'UPDATE users SET name = ?, email = ?, address = ? WHERE id = ?',
      [name, email, address, userId]
    );

    // Get updated user
    const [updatedUsers] = await db.promise().query(
      'SELECT id, name, email, address, role FROM users WHERE id = ?', 
      [userId]
    );
    const updatedUser = updatedUsers[0];

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin Registration (requires a special key)
router.post("/admin/register", async (req, res) => {
  const { name, email, password, address, adminKey } = req.body;

  // Verify admin key (this should be a secure environment variable in production)
  if (adminKey !== "admin-secret-123") {
    return res.status(403).json({ error: "Invalid admin key" });
  }

  if (!name || !email || !password || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists (case insensitive)
    const [existingUsers] = await db.promise().query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", 
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "This email is already in use" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save with admin role
    await db.promise().query(
      "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)", 
      [name, email, hashedPassword, address, "product_manager"]
    );
    
    console.log(`Admin user registered with email: ${email}`);
    res.json({ message: "Admin user successfully registered" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
