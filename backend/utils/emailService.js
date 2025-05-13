const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { createTestEmailTransporter } = require('./testEmailService');

// Flag to use test email (Ethereal) instead of real emails
const USE_TEST_EMAIL = process.env.USE_TEST_EMAIL === 'true' || process.env.EMAIL_PASSWORD === 'your_app_password';

// Create a transporter with email service configuration
const createTransporter = async () => {
  // Use test email if specified or if email credentials are not properly configured
  if (USE_TEST_EMAIL) {
    console.log('Using test email service (Ethereal) instead of real email');
    try {
      const { transporter, account } = await createTestEmailTransporter();
      console.log(`Test email account: ${account.user}`);
      return { transporter, isTestAccount: true, testAccount: account };
    } catch (error) {
      console.error('Failed to create test email account:', error);
      console.error('Falling back to configured email settings');
    }
  }
  
  // Use configured email settings
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };
  
  console.log(`Email Configuration: HOST=${config.host}, PORT=${config.port}, SECURE=${config.secure}, USER=${config.auth.user}`);
  
  if (!config.auth.user || !config.auth.pass || config.auth.pass === 'your_app_password') {
    console.error('CRITICAL EMAIL CONFIG ERROR: Email credentials not properly configured in .env file');
    console.error('For Gmail, you need to set up an App Password. See README.md for instructions.');
  }
  
  return { transporter: nodemailer.createTransport(config), isTestAccount: false };
};

/**
 * Send an email with an invoice attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.invoicePath - Path to invoice PDF
 * @returns {Promise} - Result of email sending operation
 */
const sendInvoiceEmail = async (options) => {
  try {
    console.log(`Sending invoice email to registered address: ${options.to}`);
    
    // Validate email options
    if (!options.to) {
      throw new Error('Recipient email address is missing');
    }
    
    const { transporter, isTestAccount, testAccount } = await createTransporter();
    
    // Basic email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || (isTestAccount ? `E-Commerce Store <${testAccount.user}>` : '"E-Commerce Store" <store@example.com>'),
      to: options.to,
      subject: options.subject || 'Your Invoice',
      text: options.text || 'Please find your invoice attached.',
      html: options.html || '<p>Please find your invoice attached.</p>'
    };
    
    // Add attachment if provided
    if (options.invoicePath) {
      const filename = path.basename(options.invoicePath);
      console.log(`Attaching invoice: ${filename} from path: ${options.invoicePath}`);
      
      // Check if file exists
      if (!fs.existsSync(options.invoicePath)) {
        console.error(`Invoice file not found at path: ${options.invoicePath}`);
        throw new Error(`Invoice file not found: ${options.invoicePath}`);
      }
      
      mailOptions.attachments = [
        {
          filename,
          path: options.invoicePath,
          contentType: 'application/pdf'
        }
      ];
    } else {
      console.warn('No invoice path provided for attachment');
    }
    
    // Send email
    console.log('Attempting to send email now...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // For test accounts, get the message URL
    if (isTestAccount) {
      const messageUrl = nodemailer.getTestMessageUrl(info);
      console.log('=======================================');
      console.log('TEST EMAIL PREVIEW URL:', messageUrl);
      console.log('Open this URL to view the test email');
      console.log('=======================================');
      info.messageUrl = messageUrl;
    }
    
    return info;
  } catch (error) {
    console.error('ERROR DETAILS for sending email:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication error: Check your email username and password in .env file');
      console.error('For Gmail, you need to generate an App Password. Add USE_TEST_EMAIL=true to use a test email service instead.');
    } else if (error.code === 'ESOCKET') {
      console.error('Socket error: Check your email host and port settings');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection error: Could not connect to email server');
    }
    
    throw error;
  }
};

/**
 * Send an email notification when order status changes to in-transit
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {Object} order - Order details
 * @returns {Promise} - Result of email sending operation
 */
async function sendOrderInTransitEmail(email, name, order) {
  console.log(`Sending in-transit notification to: ${email}`);
  
  const subject = `Order #${order.id} Update: Your Order is On Its Way!`;
  
  const html = `
    <h2>Hello ${name},</h2>
    <p>Great news! Your order #${order.id} has been shipped and is now on its way to you.</p>
    <p>Here's a summary of your order:</p>
    <ul>
      <li><strong>Order ID:</strong> #${order.id}</li>
      <li><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</li>
      <li><strong>Status:</strong> In Transit</li>
      <li><strong>Delivery Address:</strong> ${order.delivery_address}</li>
    </ul>
    <p>You will receive another notification when your order has been delivered.</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>Your Online Store Team</p>
  `;

  try {
    const { transporter, isTestAccount, testAccount } = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || (isTestAccount ? `E-Commerce Store <${testAccount.user}>` : '"E-Commerce Store" <store@example.com>'),
      to: email,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('In-transit email sent successfully:', info.messageId);
    
    if (isTestAccount) {
      const messageUrl = nodemailer.getTestMessageUrl(info);
      console.log('TEST EMAIL PREVIEW URL:', messageUrl);
      info.messageUrl = messageUrl;
    }
    
    return info;
  } catch (error) {
    console.error('Error sending in-transit email:', error);
    throw error;
  }
}

/**
 * Send an email notification when order status changes to delivered
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {Object} order - Order details
 * @returns {Promise} - Result of email sending operation
 */
async function sendOrderDeliveredEmail(email, name, order) {
  console.log(`Sending delivery notification to: ${email}`);
  
  const subject = `Order #${order.id} Update: Your Order Has Been Delivered!`;
  
  const html = `
    <h2>Hello ${name},</h2>
    <p>Your order #${order.id} has been delivered!</p>
    <p>Here's a summary of your order:</p>
    <ul>
      <li><strong>Order ID:</strong> #${order.id}</li>
      <li><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</li>
      <li><strong>Status:</strong> Delivered</li>
      <li><strong>Delivery Address:</strong> ${order.delivery_address}</li>
    </ul>
    <p>We hope you enjoy your purchase. If you have any questions or concerns about your order, please don't hesitate to contact us.</p>
    <p>Thank you for shopping with us!</p>
    <p>Best regards,<br>Your Online Store Team</p>
  `;

  try {
    const { transporter, isTestAccount, testAccount } = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || (isTestAccount ? `E-Commerce Store <${testAccount.user}>` : '"E-Commerce Store" <store@example.com>'),
      to: email,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Delivery email sent successfully:', info.messageId);
    
    if (isTestAccount) {
      const messageUrl = nodemailer.getTestMessageUrl(info);
      console.log('TEST EMAIL PREVIEW URL:', messageUrl);
      info.messageUrl = messageUrl;
    }
    
    return info;
  } catch (error) {
    console.error('Error sending delivery email:', error);
    throw error;
  }
}

/**
 * Send an email notification when order is cancelled
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {Object} order - Order details
 * @returns {Promise} - Result of email sending operation
 */
async function sendOrderCancelledEmail(email, name, order) {
  console.log(`Sending cancellation notification to: ${email}`);
  
  const subject = `Order #${order.id} Has Been Cancelled`;
  
  const html = `
    <h2>Hello ${name},</h2>
    <p>Your order #${order.id} has been cancelled as requested.</p>
    <p>Here's a summary of your cancelled order:</p>
    <ul>
      <li><strong>Order ID:</strong> #${order.id}</li>
      <li><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</li>
      <li><strong>Status:</strong> Cancelled</li>
    </ul>
    <p>If you have any questions about your cancellation or would like to place a new order, please don't hesitate to contact us.</p>
    <p>Thank you for your understanding.</p>
    <p>Best regards,<br>Your Online Store Team</p>
  `;

  try {
    const { transporter, isTestAccount, testAccount } = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || (isTestAccount ? `E-Commerce Store <${testAccount.user}>` : '"E-Commerce Store" <store@example.com>'),
      to: email,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent successfully:', info.messageId);
    
    if (isTestAccount) {
      const messageUrl = nodemailer.getTestMessageUrl(info);
      console.log('TEST EMAIL PREVIEW URL:', messageUrl);
      info.messageUrl = messageUrl;
    }
    
    return info;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendDiscountNotification(email, name, productName, discountType, discountValue) {
  const subject = 'New Discount Available!';
  const discountText = discountType === 'percentage' 
    ? `${discountValue}% off` 
    : `$${discountValue} off`;
  
  const html = `
    <h2>Hello ${name},</h2>
    <p>Great news! A new discount is available for a product in your wishlist.</p>
    <p><strong>Product:</strong> ${productName}</p>
    <p><strong>Discount:</strong> ${discountText}</p>
    <p>Hurry up and check it out before the offer ends!</p>
    <p>Best regards,<br>Your Online Store Team</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html
    });
    console.log(`Discount notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendPriceApprovalNotification(email, name, productName, price) {
  const subject = 'Product Price Approved';
  const html = `
    <h2>Hello ${name},</h2>
    <p>The price for a product in your wishlist has been approved.</p>
    <p><strong>Product:</strong> ${productName}</p>
    <p><strong>Price:</strong> $${price}</p>
    <p>You can now purchase this product!</p>
    <p>Best regards,<br>Your Online Store Team</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html
    });
    console.log(`Price approval notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendInvoiceEmail,
  sendDiscountNotification,
  sendPriceApprovalNotification,
  sendOrderInTransitEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail
}; 