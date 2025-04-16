const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Ensure the invoice directory exists
const ensureInvoiceDir = async () => {
  const invoiceDir = path.join(__dirname, '../invoices');
  await fs.ensureDir(invoiceDir);
  return invoiceDir;
};

// Define colors for a modern look
const colors = {
  primary: '#4F46E5', // Indigo
  secondary: '#6B7280', // Gray
  light: '#F3F4F6', // Light Gray
  border: '#E5E7EB', // Border Color
  text: '#1F2937', // Dark Gray
  success: '#10B981' // Green
};

// Helper to draw a rounded rectangle
const drawRoundedRect = (doc, x, y, width, height, radius, fillColor) => {
  doc.roundedRect(x, y, width, height, radius).fill(fillColor);
};

/**
 * Generate a PDF invoice for an order
 * @param {Object} order - The order object with all details
 * @param {Object} user - User information
 * @returns {Promise<string>} - Path to the generated invoice
 */
const generateInvoice = async (order, user) => {
  const invoiceDir = await ensureInvoiceDir();
  const invoiceFilename = `invoice-${order.id}-${Date.now()}.pdf`;
  const invoicePath = path.join(invoiceDir, invoiceFilename);
  
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with a better margin
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
      
      const writeStream = fs.createWriteStream(invoicePath);
      
      // When the PDF is done being written, resolve the promise
      writeStream.on('finish', () => resolve(invoicePath));
      writeStream.on('error', reject);
      
      // Pipe the PDF to the file
      doc.pipe(writeStream);
      
      // Set some document properties
      doc.info.Title = `Invoice #INV-${order.id}`;
      doc.info.Author = 'E-Commerce Store';
      
      // Background color for header
      drawRoundedRect(doc, 50, 50, doc.page.width - 100, 130, 5, colors.primary);
      
      // Add the white header text
      doc.fill('white');
      doc.fontSize(28).text('INVOICE', 70, 70);
      doc.fontSize(12);
      doc.text(`Invoice #: INV-${order.id}`, 70, 105);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 70, 125);
      
      // Order status badge
      const orderStatus = order.status || 'processing';
      const statusWidth = 120;
      const statusX = doc.page.width - 70 - statusWidth;
      drawRoundedRect(doc, statusX, 70, statusWidth, 30, 15, 'white');
      doc.fill(colors.primary).fontSize(14)
         .text(orderStatus.toUpperCase(), statusX, 78, { 
           width: statusWidth, 
           align: 'center' 
         });
      
      // Company logo or name on the right
      doc.fill('white').fontSize(18)
         .text('E-Commerce Store', statusX, 125, { width: statusWidth, align: 'right' });
      
      // Reset text color
      doc.fill(colors.text);
      
      // Top section - company and billing info
      const topSectionY = 210;
      const columnWidth = (doc.page.width - 100) / 2;
      
      // Company info
      doc.fontSize(14).fillColor(colors.primary).text('FROM', 50, topSectionY);
      doc.fillColor(colors.text).fontSize(12).text('E-Commerce Store', 50, topSectionY + 25);
      doc.fillColor(colors.secondary).fontSize(10);
      doc.text('123 Commerce Street', 50, topSectionY + 45);
      doc.text('Istanbul, Turkey', 50, topSectionY + 60);
      doc.text('info@ecommerce-store.com', 50, topSectionY + 75);
      doc.text('+90 212 XXX XX XX', 50, topSectionY + 90);
      
      // Customer info
      doc.fillColor(colors.primary).fontSize(14).text('SHIPPING ADDRESS', 50 + columnWidth, topSectionY);
      doc.fillColor(colors.text).fontSize(12).text(user.name, 50 + columnWidth, topSectionY + 25);
      doc.fillColor(colors.secondary).fontSize(10);
      doc.text(`Email: ${user.email}`, 50 + columnWidth, topSectionY + 45);
      
      // Make sure the address wraps properly with enough space
      const addressLines = doc.heightOfString(order.delivery_address, {
        width: columnWidth - 20,
      });
      
      doc.text(order.delivery_address, 50 + columnWidth, topSectionY + 60, {
        width: columnWidth - 20,
        height: 100, // Increased height to ensure visibility
        ellipsis: false
      });
      
      // Items table
      const tableTop = topSectionY + 140;
      
      // Table header background
      drawRoundedRect(doc, 50, tableTop, doc.page.width - 100, 30, 5, colors.light);
      
      // Table header text
      doc.fillColor(colors.primary).fontSize(10);
      doc.text('ITEM', 70, tableTop + 10);
      doc.text('DESCRIPTION', 170, tableTop + 10);
      doc.text('QTY', 320, tableTop + 10);
      doc.text('PRICE', 380, tableTop + 10);
      doc.text('AMOUNT', 480, tableTop + 10);
      
      // Reset fill color
      doc.fillColor(colors.text);
      
      // Table rows
      let tableRow = tableTop + 40;
      let totalPrice = 0;
      
      // Add items
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, i) => {
          // Convert price to number if it's a string
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
          const amount = price * item.quantity;
          totalPrice += amount;
          
          // Alternate row colors
          if (i % 2 === 0) {
            drawRoundedRect(doc, 50, tableRow - 10, doc.page.width - 100, 30, 0, colors.light);
          }
          
          doc.fontSize(10).fillColor(colors.text);
          doc.text(`#${item.product_id}`, 70, tableRow);
          doc.text(item.product_name || 'Product', 170, tableRow, { width: 140, ellipsis: true });
          doc.text(item.quantity.toString(), 320, tableRow);
          doc.text(`$${price.toFixed(2)}`, 380, tableRow);
          doc.text(`$${amount.toFixed(2)}`, 480, tableRow);
          
          tableRow += 30;
        });
      }
      
      // Add a divider line
      doc.strokeColor(colors.border).lineWidth(1)
         .moveTo(50, tableRow).lineTo(doc.page.width - 50, tableRow).stroke();
      
      tableRow += 20;
      
      // Add totals
      const totalAmount = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount;
      
      doc.fontSize(10).fillColor(colors.secondary).text('Subtotal:', 380, tableRow);
      doc.fillColor(colors.text).text(`$${totalAmount.toFixed(2)}`, 480, tableRow);
      
      // Tax (if applicable)
      // tableRow += 20;
      // doc.fillColor(colors.secondary).text('Tax (0%):', 380, tableRow);
      // doc.fillColor(colors.text).text('$0.00', 480, tableRow);
      
      // Total
      tableRow += 20;
      drawRoundedRect(doc, 350, tableRow - 5, doc.page.width - 350 - 50, 30, 5, colors.primary);
      doc.fillColor('white').text('TOTAL:', 380, tableRow);
      doc.text(`$${totalAmount.toFixed(2)}`, 480, tableRow);
      
      // Thank you message
      tableRow += 60;
      doc.fillColor(colors.primary).fontSize(14)
         .text('Thank you for your business!', 50, tableRow, { align: 'center' });
      
      // Payment info and terms
      tableRow += 30;
      doc.fillColor(colors.text).fontSize(10)
         .text('Payment Information', 50, tableRow, { align: 'center', underline: true });
      
      tableRow += 20;
      doc.fillColor(colors.secondary).fontSize(9)
         .text('Please make payment within 15 days from the date of invoice.', 50, tableRow, { align: 'center' });
      
      // Footer
      const footerY = doc.page.height - 50;
      doc.fillColor(colors.secondary).fontSize(8)
         .text('© 2025 E-Commerce Store. All rights reserved.', 50, footerY, { align: 'center' });
      
      // Add page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor(colors.secondary).fontSize(8)
           .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 30, { align: 'center' });
      }
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF document:', error);
      reject(error);
    }
  });
};

/**
 * Get the path to an existing invoice or generate a new one
 * @param {Object} order - The order object with all details
 * @param {Object} user - User information
 * @returns {Promise<string>} - Path to the invoice
 */
const getOrGenerateInvoice = async (order, user) => {
  const invoiceDir = await ensureInvoiceDir();
  const invoicePattern = new RegExp(`invoice-${order.id}-\\d+\\.pdf`);
  
  // Check if invoice already exists
  const files = await fs.readdir(invoiceDir);
  const existingInvoice = files.find(file => invoicePattern.test(file));
  
  if (existingInvoice) {
    return path.join(invoiceDir, existingInvoice);
  }
  
  // Generate new invoice if it doesn't exist
  return generateInvoice(order, user);
};

module.exports = {
  generateInvoice,
  getOrGenerateInvoice
}; 