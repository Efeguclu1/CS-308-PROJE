const express = require("express");
const cors = require("cors");  // ✅ CORS Kütüphanesini ekle
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const db = require("./config/db");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = require('./app'); // Import the app from app.js

// Token verification middleware
const verifyToken = (req, res, next) => {
  console.log('Verifying token in auth middleware');
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Authorization header:', authHeader);
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Invalid token format in header');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully, decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token: ' + error.message });
  }
};

// ✅ CORS Middleware'i ekleyelim
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], // Frontend'in çalışabileceği tüm portlar
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// ✅ Basit API Test Endpoint'i
app.get("/", (req, res) => {
  res.send("Backend çalışıyor!");
});

// Test endpoint for token verification
app.get('/api/test-auth', verifyToken, (req, res) => {
  console.log('Test auth endpoint called, verified user:', req.user);
  res.json({ 
    success: true, 
    message: 'Token is valid', 
    user: req.user 
  });
});

// Route-specific debug middleware for orders before authentication
app.use('/api/orders', (req, res, next) => {
  console.log('Orders API called:', {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
});

// ✅ Auth Routes (Kayıt & Giriş)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

// Protected routes with token verification
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", verifyToken, paymentRoutes);

// ✅ Rating Routes
const ratingRoutes = require("./routes/ratingRoutes");
app.use("/api/ratings", ratingRoutes);

// Order routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", verifyToken, orderRoutes);

<<<<<<< HEAD
const refundRoutes = require("./routes/refundRoutes");
app.use("/api/refunds", refundRoutes);



=======
<<<<<<< Updated upstream
=======
const refundRoutes = require("./routes/refundRoutes");
app.use("/api/refunds", verifyToken, refundRoutes);



>>>>>>> Stashed changes
>>>>>>> 75efcf1 (return refund update)
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5001;
// Remove this listen call, as app.js handles it
// app.listen(PORT, () => {
//   // Use the console log from app.js which is now starting the server
//   // console.log(`✅ Server is running on port ${PORT}`); 
// });
