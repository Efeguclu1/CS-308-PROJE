const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Order Routes'un doğru yüklendiğinden emin olalım
let orderRoutes;
try {
  orderRoutes = require("./routes/orderRoutes");
  console.log("✅ Order routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading order routes:", error);
}

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);

// Order routes'u sadece yüklendiyse kullan
if (orderRoutes) {
  app.use("/api/orders", orderRoutes);
  console.log("✅ Order routes mounted at /api/orders");
} else {
  // Order routes yoksa basit bir yanıt döndüren geçici bir route oluştur
  console.log("⚠️ Using temporary order routes");
  app.get('/api/orders/test', (req, res) => {
    console.log("Temporary order routes test endpoint called");
    res.json({ message: 'Temporary order routes response' });
  });
  
  app.get('/api/orders/user/:userId', (req, res) => {
    console.log(`Temporary route: Get orders for user ${req.params.userId}`);
    res.json([]);
  });
}

// Yakalanmayan hataları yakala
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 404 handler
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app; 