const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getOrGenerateInvoice } = require('../utils/invoiceGenerator');
const path = require('path');
const fs = require('fs-extra');

// Generate or retrieve an invoice for a specific order
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  // Debug the user object to see what we're getting
  console.log('User object from token:', req.user);
  
  // More robust user ID extraction
  let userId;
  if (req.user && (req.user.id || req.user.userId)) {
    userId = req.user.id || req.user.userId;
    console.log('Found user ID in token:', userId);
  } else {
    console.log('No valid user ID in token, req.user:', req.user);
    return res.status(401).json({
      success: false,
      error: 'Authentication required - no valid user ID'
    });
  }
  
  try {
    // Check if order exists and belongs to the user
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    console.log('Order query result:', orders);
    
    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found or does not belong to this user' 
      });
    }
    
    const order = orders[0];
    
    // Get order items
    const [items] = await db.promise().query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );
    
    order.items = items || [];
    
    // Get user information
    const [users] = await db.promise().query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const user = users[0];
    
    // Generate or retrieve invoice
    console.log('Generating invoice for order:', order.id);
    const invoicePath = await getOrGenerateInvoice(order, user);
    console.log('Invoice generated at:', invoicePath);
    
    // Set proper content type for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-order-${orderId}.pdf"`);
    
    // Try to verify the file exists before sending
    if (!fs.existsSync(invoicePath)) {
      console.error('Error: Generated invoice file does not exist:', invoicePath);
      return res.status(500).json({
        success: false,
        error: 'Generated invoice file not found'
      });
    }
    
    // Read file size
    const stats = fs.statSync(invoicePath);
    console.log(`File size: ${stats.size} bytes`);
    
    // Send the invoice
    console.log('Sending invoice file...');
    fs.createReadStream(invoicePath).pipe(res);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate invoice',
      details: error.message
    });
  }
});

module.exports = router; 