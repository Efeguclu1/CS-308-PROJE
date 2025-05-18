const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();
const { encrypt } = require('./backend/utils/simpleEncryption');

const password = 'admin123'; // Admin şifresi
const email = 'admin@example.com'; // Admin email'i
const address = 'Admin Office Address'; // Admin adresi
const name = 'Admin User'; // Admin adı

// Veritabanı bağlantısı
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456.',
  database: 'online_store',
});

async function createAdmin() {
  try {
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Email, Ad ve Adresi şifrele
    const encryptedEmail = encrypt(email.trim().toLowerCase());
    const encryptedName = encrypt(name);
    const encryptedAddress = encrypt(address);

    // Önce mevcut admin kullanıcısını silelim (eğer varsa)
    const deleteQuery = `DELETE FROM users WHERE email = ?`;
    db.query(deleteQuery, [encryptedEmail], (err, result) => {
      if (err) {
        // Silme hatası önemli değil, ekleme başarılı olursa sorun çözülür
        console.error('Error deleting existing admin (may not exist):', err);
      }
      console.log('Attempted to delete existing admin. Rows affected:', result ? result.affectedRows : 0);
    });

    // Admin kullanıcısını ekle
    const insertQuery = `
      INSERT INTO users (email, password, name, role, address)
      VALUES (?, ?, ?, 'product_manager', ?)
    `;

    db.query(insertQuery, [encryptedEmail, hashedPassword, encryptedName, encryptedAddress], (err, result) => {
      if (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
      }
      console.log('Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Veritabanı bağlantısını aç ve scripti çalıştır
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Database connected for admin script.');
  createAdmin();
});