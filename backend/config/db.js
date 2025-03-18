const mysql = require("mysql2/promise");
require("dotenv").config(); // .env dosyasını yükle

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.query('SELECT 1')
  .then(() => {
    console.log("✅ MySQL'e başarıyla bağlanıldı!");
  })
  .catch((err) => {
    console.error("❌ MySQL Bağlantı Hatası: " + err.message);
  });

// Export the pool
module.exports = pool;
