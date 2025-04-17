const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getOrGenerateInvoice } = require('../utils/invoiceGenerator');
const path = require('path');
const fs = require('fs-extra');

console.log('*** invoiceRoutes.js file loaded ***');

// Generate or retrieve an invoice for a specific order
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  // Restore original user ID extraction
  let userId;
  if (req.user && req.user.id) { // Check for req.user and req.user.id
    userId = req.user.id;
  } else {
    // Log details if user ID is missing
    console.error('Authentication error: User ID missing from request token.', { user: req.user });
    return res.status(401).json({
      success: false,
      error: 'Authentication required - user ID not found in token'
    });
  }
  
  try {
    // Check if order exists and belongs to the user
    const [orders] = await db.promise().query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
        
    if (orders.length === 0) {
      console.log(`Order not found or permission denied: orderId=${orderId}, userId=${userId}`);
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
    
    // Get user information (needed for the invoice content)
    const [users] = await db.promise().query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId] 
    );
    
    if (users.length === 0) {
       // This case should be rare if the order query succeeded, but good to check
      console.error(`User not found for invoice generation: userId=${userId}`);
      return res.status(404).json({ 
        success: false, 
        error: 'User associated with the order not found' 
      });
    }
    
    const user = users[0];
    
    // Generate or retrieve invoice
    const invoicePath = await getOrGenerateInvoice(order, user);
        
    // Try to verify the file exists before sending
    if (!fs.existsSync(invoicePath)) {
      console.error('Error: Generated invoice file does not exist after generation attempt:', invoicePath);
      return res.status(500).json({
        success: false,
        error: 'Generated invoice file could not be located'
      });
    }
        
    // Set proper content type for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-order-${orderId}.pdf"`);
        
    // Send the invoice
    fs.createReadStream(invoicePath).pipe(res);

  } catch (error) {
    console.error(`Error generating invoice for order ${orderId}, user ${userId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate invoice due to a server error',
      details: error.message // Avoid sending detailed stack in production
    });
  }
});

module.exports = router; 