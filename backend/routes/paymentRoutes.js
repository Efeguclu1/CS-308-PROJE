const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getOrGenerateInvoice } = require('../utils/invoiceGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');
const { encrypt, decrypt } = require('../utils/simpleEncryption');

// Ödeme işlemini gerçekleştir
router.post('/process', async (req, res) => {
  const connection = await db.promise();
  
  try {
    const { 
      cardNumber, 
      cardName, 
      expirationMonth, 
      expirationYear, 
      cvv, 
      userId, 
      items, 
      totalAmount, 
      checkoutEmail,
      shippingAddress 
    } = req.body;

    // Validate payment information
    if (!cardNumber || !cardName || !expirationMonth || !expirationYear || !cvv) {
      return res.status(400).json({ success: false, error: 'Missing payment information' });
    }

    // Validate card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      return res.status(400).json({ success: false, error: 'Card number must be 16 digits' });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items in order' });
    }

    // Get user's address and email directly from database to ensure correct registered email
    const [userResult] = await connection.query(
      'SELECT id, name, email, address FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    
    const user = userResult[0];
    
    // Decrypt user's email from database before using it
    const decryptedUserEmail = decrypt(user.email);
    const decryptedUserAddress = decrypt(user.address);
    const decryptedUserName = decrypt(user.name);
    
    // Use checkout email if provided, otherwise fall back to user's registered email
    const invoiceEmail = checkoutEmail || decryptedUserEmail;
    
    // Use shipping address from checkout if provided, otherwise use registered address
    const deliveryAddress = shippingAddress || decryptedUserAddress;
    
    // Log user's email addresses that will be sent the invoice
    console.log(`Processing payment for user ID: ${userId}`);
    console.log(`User's registered email (decrypted): ${decryptedUserEmail}`);
    console.log(`Email used for invoice: ${invoiceEmail}`);
    console.log(`Delivery address: ${deliveryAddress}`);

    // Transaction başlat
    await connection.beginTransaction();
    
    let orderId = null; // Declare orderId outside the try block so it's accessible in all scopes
    
    try {
      // Create order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_amount, status, delivery_address) VALUES (?, ?, ?, ?)',
        [userId, totalAmount, 'processing', deliveryAddress]
      );
      orderId = orderResult.insertId;

      // Add order items and update stock
      for (const item of items) {
        // Check stock
        const [stockResult] = await connection.query(
          'SELECT stock FROM products WHERE id = ?',
          [item.productId]
        );

        if (!stockResult[0]) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (stockResult[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.productId}`);
        }

        // Add order item
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.productId, item.quantity, item.price]
        );

        // Update stock
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }

      // Encrypt sensitive payment data
      const encryptedCardNumber = encrypt(cleanCardNumber);
      const encryptedCardName = encrypt(cardName);
      const encryptedCVV = encrypt(cvv);

      // Store encrypted payment info
      await connection.query(
        `INSERT INTO payment_info 
        (order_id, encrypted_card_number, encrypted_card_name, encrypted_cvv, expiration_month, expiration_year) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, encryptedCardNumber, encryptedCardName, encryptedCVV, expirationMonth, expirationYear]
      );

      // Transaction'ı onayla
      await connection.commit();
      
      // Get order details for invoice generation
      const [orderDetails] = await connection.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (!orderDetails || orderDetails.length === 0) {
        throw new Error('Failed to retrieve order details');
      }
      
      const order = orderDetails[0];
      
      // Get order items for invoice
      const [orderItems] = await connection.query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      order.items = orderItems || [];
      
      try {
        // Generate invoice
        console.log('Generating invoice for order:', orderId);
        
        // Create user object with shipping address for invoice
        const invoiceUser = {
          id: user.id,
          name: decryptedUserName,
          email: invoiceEmail,
        };
        
        // Make sure the shipping address is explicitly set on the order
        order.delivery_address = deliveryAddress;
        
        console.log('Creating invoice with shipping address:', deliveryAddress);
        const invoicePath = await getOrGenerateInvoice(order, invoiceUser);
        console.log('Invoice generated at:', invoicePath);
        
        // Send invoice to the email entered during checkout, or fall back to registered email
        console.log(`Sending invoice to: ${invoiceEmail}`);
        const emailResult = await sendInvoiceEmail({
          to: invoiceEmail, // Using the email from checkout or user record
          subject: `Your Invoice for Order #${orderId}`,
          text: `Dear ${decryptedUserName},\n\nThank you for your purchase. Your order #${orderId} has been processed successfully. Please find your invoice attached.\n\nRegards,\nTechStore Team`,
          html: `<!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Order Confirmation</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Thank You For Your Order!</h1>
                    </div>
                    <div class="content">
                      <p>Dear ${decryptedUserName},</p>
                      <p>Your order #${orderId} has been processed successfully.</p>
                      <p>Please find your invoice attached to this email.</p>
                      <p>If you have any questions, please contact our customer service.</p>
                      <p><strong>Order Details:</strong></p>
                      <p>Order ID: ${orderId}<br>
                      Total Amount: $${parseFloat(totalAmount).toFixed(2)}<br>
                      Status: Processing</p>
                    </div>
                    <div class="footer">
                      <p>Regards,<br>TechStore Team</p>
                      <p>© 2025 TechStore. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>`,
          invoicePath: invoicePath
        });
        
        console.log('Invoice email sent to:', invoiceEmail);
        
        // If using Ethereal test email, log the preview URL
        if (emailResult && emailResult.messageUrl) {
          console.log('Email preview URL:', emailResult.messageUrl);
        }
      } catch (emailError) {
        // Log error but don't fail the transaction
        console.error('Error sending invoice email:', emailError.message);
        console.error('This error is not fatal to the order process - order was still created successfully');
        console.error('To fix email sending:');
        console.error('1. Check the email credentials in .env file');
        console.error('2. For Gmail, generate an App Password in Google Account settings');
        console.error('3. Or use a test email service like Ethereal (see .env file)');
      }
    } catch (invoiceError) {
      // Log error but don't fail the transaction
      console.error('Error generating invoice:', invoiceError.message);
    }
    
    // Check if orderId exists (it should if the transaction was committed)
    if (!orderId) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create order - no order ID was generated'
      });
    }
      
    // Başarılı response - always include the orderId
    res.json({ 
      success: true, 
      orderId: orderId,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to process payment'
    });
  }
});

module.exports = router; 