import puppeteer from 'puppeteer';

/**
 * Generates a GST-compliant tax invoice HTML string
 * Decides CGST+SGST (intra-state) or IGST (inter-state) based on vendor state vs buyer state
 */
const buildInvoiceHtml = (invoice, items, vendor, po) => {
  const buyerState = process.env.BUYER_STATE || 'Gujarat';
  const vendorState = vendor.state || '';
  const isSameState = vendorState.toLowerCase().trim() === buyerState.toLowerCase().trim();

  const formatCurrency = (n) => `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const taxRows = isSameState
    ? `<tr><td>CGST (9%)</td><td>${formatCurrency(invoice.cgst_amount)}</td></tr>
       <tr><td>SGST (9%)</td><td>${formatCurrency(invoice.sgst_amount)}</td></tr>`
    : `<tr><td>IGST (18%)</td><td>${formatCurrency(invoice.igst_amount)}</td></tr>`;

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.item_name}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${formatCurrency(item.unit_price)}</td>
      <td>${item.tax_percent}%</td>
      <td>${formatCurrency(item.tax_amount)}</td>
      <td>${formatCurrency(item.total_price)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand h1 { font-size: 22px; color: #1d4ed8; font-weight: 700; }
    .brand p { color: #555; font-size: 12px; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; }
    .invoice-title p { font-size: 12px; color: #555; margin-top: 4px; }
    .divider { border: none; border-top: 2px solid #1d4ed8; margin: 12px 0; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .meta-box h4 { font-size: 11px; text-transform: uppercase; color: #777; margin-bottom: 6px; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    thead { background-color: #1d4ed8; color: white; }
    thead th { padding: 8px 10px; text-align: left; font-size: 12px; }
    tbody tr:nth-child(even) { background-color: #f5f8ff; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .summary { display: flex; justify-content: flex-end; margin-top: 12px; }
    .summary table { width: 280px; }
    .summary table td { padding: 5px 10px; border: none; }
    .summary .total-row { font-weight: 700; font-size: 14px; border-top: 2px solid #1d4ed8; }
    .words-box { background: #f0f4ff; border-left: 4px solid #1d4ed8; padding: 10px 14px; margin-top: 16px; font-size: 12px; }
    .words-box span { font-weight: 600; }
    .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #777; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>VendorBridge</h1>
      <p>${process.env.BUYER_ADDRESS || '123 Business Park, Ahmedabad, Gujarat'}</p>
      <p>GSTIN: ${process.env.BUYER_GSTIN || 'XXXXXXXXXXXX'}</p>
    </div>
    <div class="invoice-title">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
      <p><strong>Issue Date:</strong> ${invoice.issue_date}</p>
      <p><strong>Due Date:</strong> ${invoice.due_date}</p>
    </div>
  </div>
  <hr class="divider"/>
  <div class="meta">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p><strong>${vendor.company_name}</strong></p>
      <p>${vendor.address || ''}</p>
      <p>GSTIN: ${vendor.gst_number || 'N/A'}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <h4>PO Reference</h4>
      <p>${po.po_number}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Item</th><th>Qty</th><th>Unit</th>
        <th>Unit Price</th><th>Tax%</th><th>Tax Amt</th><th>Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="summary">
    <table>
      <tbody>
        <tr><td>Subtotal</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
        ${taxRows}
        <tr class="total-row"><td>TOTAL</td><td>${formatCurrency(invoice.total_amount)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="words-box">
    Amount in Words: <span>${invoice.amount_in_words}</span>
  </div>
  <div class="footer">
    <p>Thank you for your business. — VendorBridge Procurement</p>
  </div>
</body>
</html>`;
};

/**
 * Renders the invoice HTML to a PDF buffer using Puppeteer
 */
export const generateInvoicePdf = async (invoice, items, vendor, po) => {
  const html = buildInvoiceHtml(invoice, items, vendor, po);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
  return pdfBuffer;
};
