
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


