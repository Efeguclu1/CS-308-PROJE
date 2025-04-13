const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Ensure the invoice directory exists
const ensureInvoiceDir = async () => {
  const invoiceDir = path.join(__dirname, '../invoices');
  await fs.ensureDir(invoiceDir);
  return invoiceDir;
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
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(invoicePath);
    
    // When the PDF is done being written, resolve the promise
    writeStream.on('finish', () => resolve(invoicePath));
    writeStream.on('error', reject);
    
    // Pipe the PDF to the file
    doc.pipe(writeStream);
    
    // Add the header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Add company info
    doc.fontSize(12);
    doc.text('E-Commerce Store', { align: 'left' });
    doc.text('123 Commerce Street', { align: 'left' });
    doc.text('Istanbul, Turkey', { align: 'left' });
    doc.text('info@ecommerce-store.com', { align: 'left' });
    doc.moveDown();
    
    // Add invoice info
    doc.fontSize(14).text('Invoice Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Invoice #: INV-${order.id}`);
    doc.text(`Order #: ${order.id}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
    doc.moveDown();
    
    // Add customer info
    doc.fontSize(14).text('Customer Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Address: ${order.delivery_address}`);
    doc.moveDown(2);
    
    // Add table header
    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const quantityX = 280;
    const priceX = 350;
    const amountX = 450;
    
    doc.fontSize(12).text('Item', itemX, tableTop);
    doc.text('Description', descriptionX, tableTop);
    doc.text('Qty', quantityX, tableTop);
    doc.text('Price', priceX, tableTop);
    doc.text('Amount', amountX, tableTop);
    
    // Add a line
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
    
    let tableRow = tableTop + 30;
    
    // Add items
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        doc.text(`#${item.product_id}`, itemX, tableRow);
        doc.text(item.product_name || 'Product', descriptionX, tableRow);
        doc.text(item.quantity.toString(), quantityX, tableRow);
        doc.text(`$${item.price.toFixed(2)}`, priceX, tableRow);
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, amountX, tableRow);
        tableRow += 20;
      });
    }
    
    // Add a line
    doc.moveTo(50, tableRow).lineTo(550, tableRow).stroke();
    tableRow += 20;
    
    // Add total
    doc.text('Total:', 350, tableRow);
    doc.text(`$${order.total_amount.toFixed(2)}`, amountX, tableRow);
    
    // Add footer
    doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });
    
    // Finalize the PDF
    doc.end();
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