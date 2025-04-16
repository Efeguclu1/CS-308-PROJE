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

module.exports = {
  sendInvoiceEmail
}; 