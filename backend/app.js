const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/auth');
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
const orderRoutes = require("./routes/orderRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

// Debug middleware for orders
app.use('/api/orders', (req, res, next) => {
  console.log('Orders API called:', { method: req.method, url: req.url });
  next();
});

// Test endpoint for token verification
app.get('/api/test-auth', verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid', 
    user: req.user 
  });
});

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Protected routes
app.use("/api/payment", verifyToken, paymentRoutes);
app.use("/api/orders", verifyToken, orderRoutes);
app.use("/api/ratings", verifyToken, ratingRoutes);
app.use("/api/invoices", verifyToken, invoiceRoutes);

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

// Port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app; 