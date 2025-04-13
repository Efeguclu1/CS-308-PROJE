const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getOrGenerateInvoice } = require('../utils/invoiceGenerator');
const path = require('path');
const fs = require('fs-extra');

// Generate or retrieve an invoice for a specific order
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.user; // From JWT token
  
  try {
    // Check if order exists and belongs to the user
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    
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
    const invoicePath = await getOrGenerateInvoice(order, user);
    
    // Send the invoice
    res.download(invoicePath, `invoice-order-${orderId}.pdf`);
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