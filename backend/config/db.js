/*const mysql = require("mysql2");
require("dotenv").config(); // .env dosyasını yükle

const db = mysql.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASS || "", 
  database: process.env.DB_NAME, 
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Bağlantı Hatası: " + err.message);
    return;
  }
  console.log("✅ MySQL'e başarıyla bağlanıldı!");
});

module.exports = db;*/
const mysql = require("mysql");

const db = mysql.createConnection({
  host: "sql7.freesqldatabase.com",
  user: "sql7767579",
  password: "vTpAFmwAct",
  database: "sql7767579",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database.");
});

module.exports = db;


