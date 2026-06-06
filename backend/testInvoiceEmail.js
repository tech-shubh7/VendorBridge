import db from './src/models/index.js';
import invoiceService from './src/services/invoiceService.js';

async function test() {
  try {
    const invoices = await db.Invoice.findAll();
    if (invoices.length === 0) {
      console.log('No invoices found. Please create one first.');
      process.exit(0);
    }
    const invoice = invoices[0];
    console.log(`Testing email for invoice: ${invoice.invoice_number}`);
    
    // We'll send it to a fake email or whatever is configured for mailtrap
    const result = await invoiceService.sendInvoiceByEmail(
      invoice.id,
      { to: 'test@example.com', cc: '', message: 'Test message' },
      invoice.user_id // admin or someone
    );
    console.log('Email sent successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    process.exit(1);
  }
}

test();
