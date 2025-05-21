const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const { encrypt, decrypt } = require('../utils/simpleEncryption');

// Kullanıcı Kaydı (Register)
router.post("/register", async (req, res) => {
  let { name, email, password, address, tax_id } = req.body;

  if (!name || !email || !password || !address) {
    return res.status(400).json({ error: "Tüm alanlar gereklidir." });
  }

  try {
    // Encrypt user fields
    const encryptedEmail = encrypt(email.trim().toLowerCase());
    const encryptedName = encrypt(name);
    const encryptedAddress = encrypt(address);
    // Only encrypt tax_id if it exists
    const encryptedTaxId = tax_id ? encrypt(tax_id) : null;

    // Check if email already exists (encrypted, case insensitive)
    const [existingUsers] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [encryptedEmail]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Bu email adresi zaten kullanımda." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save encrypted fields
    await db.promise().query(
      "INSERT INTO users (name, email, password, address, tax_id) VALUES (?, ?, ?, ?, ?)",
      [encryptedName, encryptedEmail, hashedPassword, encryptedAddress, encryptedTaxId]
    );
    
    res.json({ message: "Kullanıcı başarıyla kaydedildi." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Kayıt başarısız." });
  }
});

// Kullanıcı Girişi (Login)
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Tüm alanlar gereklidir." });
  }

  try {
    // Encrypt email for lookup (case insensitive)
    const encryptedEmail = encrypt(email.trim().toLowerCase());
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [encryptedEmail]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Yanlış şifre" });
    }

    // Decrypt fields before sending to client
    const decryptedName = decrypt(user.name);
    const decryptedEmail = decrypt(user.email);
    const decryptedAddress = decrypt(user.address);
    // Only decrypt tax_id if it exists
    const decryptedTaxId = user.tax_id ? decrypt(user.tax_id) : null;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Giriş başarılı", 
      token,
      user: {
        id: user.id,
        name: decryptedName,
        email: decryptedEmail,
        address: decryptedAddress,
        tax_id: decryptedTaxId,
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
    const { name, email, address, tax_id, currentPassword, newPassword } = req.body;
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

    // Encrypt email to check for duplicates
    const encryptedEmail = encrypt(email.trim().toLowerCase());
    
    // Check if the email is already in use by another user
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [encryptedEmail, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email address is already in use by another account' });
    }

    // Encrypt fields before saving
    const encryptedName = encrypt(name);
    const encryptedAddress = encrypt(address);
    // Only encrypt tax_id if it exists
    const encryptedTaxId = tax_id ? encrypt(tax_id) : null;

    // Update user profile
    await db.promise().query(
      'UPDATE users SET name = ?, email = ?, address = ?, tax_id = ? WHERE id = ?',
      [encryptedName, encryptedEmail, encryptedAddress, encryptedTaxId, userId]
    );

    // Get updated user
    const [updatedUsers] = await db.promise().query(
      'SELECT id, name, email, address, tax_id, role FROM users WHERE id = ?', 
      [userId]
    );
    const updatedUser = updatedUsers[0];

    // Decrypt fields before sending to client
    const decryptedUser = {
      id: updatedUser.id,
      name: decrypt(updatedUser.name),
      email: decrypt(updatedUser.email),
      address: decrypt(updatedUser.address),
      tax_id: updatedUser.tax_id ? decrypt(updatedUser.tax_id) : null,
      role: updatedUser.role
    };

    res.json({ 
      message: 'Profile updated successfully',
      user: decryptedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin Registration (requires a special key)
router.post("/admin/register", async (req, res) => {
  const { name, email, password, address, tax_id, adminKey } = req.body;

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
      "INSERT INTO users (name, email, password, address, tax_id, role) VALUES (?, ?, ?, ?, ?, ?)", 
      [name, email, hashedPassword, address, tax_id, "product_manager"]
    );
    
    console.log(`Admin user registered with email: ${email}`);
    res.json({ message: "Admin user successfully registered" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
