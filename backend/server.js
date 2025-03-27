const express = require("express");
const cors = require("cors");  // ✅ CORS Kütüphanesini ekle
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const db = require("./config/db");

dotenv.config();

const app = express();

// ✅ CORS Middleware'i ekleyelim
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], // Frontend'in çalışabileceği tüm portlar
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());

// ✅ Basit API Test Endpoint'i
app.get("/", (req, res) => {
  res.send("Backend çalışıyor!");
});

// ✅ Auth Routes (Kayıt & Giriş)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
