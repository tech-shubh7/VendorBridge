import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { amountInWords } from '../utils/amountInWords.js';
import { generateInvoicePdf } from '../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../utils/email.js';

/**
 * Compute CGST/SGST vs IGST based on vendor state vs buyer state
 * Returns { cgst_amount, sgst_amount, igst_amount, total_tax }
 */
const computeGstBreakdown = (subtotal, taxAmount, vendorState) => {
  const buyerState = process.env.BUYER_STATE || 'Gujarat';
  const isSameState = (vendorState || '').toLowerCase().trim() === buyerState.toLowerCase().trim();

  if (isSameState) {
    const half = parseFloat((taxAmount / 2).toFixed(2));
    return { cgst_amount: half, sgst_amount: half, igst_amount: 0 };
  } else {
    return { cgst_amount: 0, sgst_amount: 0, igst_amount: parseFloat(taxAmount.toFixed(2)) };
  }
};

/**
 * Fetch PO with full quotation items, vendor and rfq_items
 */
const fetchPoWithItems = async (purchaseOrderId) => {
  return db.PurchaseOrder.findByPk(purchaseOrderId, {
    include: [
      { model: db.Vendor },
      {
        model: db.Quotation,
        include: [
          {
            model: db.QuotationItem,
            include: [{ model: db.RfqItem }]
          }
        ]
      }
    ]
  });
};

/**
 * Shape items array for PDF and API responses
 */
const shapeItems = (po) => {
  return po.Quotation.QuotationItems.map(qi => ({
    item_name: qi.RfqItem ? qi.RfqItem.item_name : 'N/A',
    quantity: qi.RfqItem ? qi.RfqItem.quantity : 0,
    unit: qi.RfqItem ? qi.RfqItem.unit : '',
    unit_price: parseFloat(qi.unit_price),
    tax_percent: parseFloat(qi.tax_percent),
    tax_amount: parseFloat(qi.tax_amount),
    total_price: parseFloat(qi.total_price)
  }));
};

/**
 * POST /api/invoices — Generate Invoice from a sent/acknowledged PO
 */
export const createInvoice = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { purchase_order_id, issue_date, due_date, notes } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!purchase_order_id || !issue_date || !due_date) {
      await transaction.rollback();
      return res.status(400).json({ message: 'purchase_order_id, issue_date, and due_date are required' });
    }

    // Use po_id as per the Invoice model
    const po = await db.PurchaseOrder.findByPk(purchase_order_id, {
      include: [{ model: db.Vendor }],
      transaction
    });

    if (!po) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    if (po.status === 'draft') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot generate invoice for a draft PO. Send the PO first.' });
    }

    const existingInvoice = await db.Invoice.findOne({ where: { po_id: purchase_order_id }, transaction });
    if (existingInvoice) {
      await transaction.rollback();
      return res.status(409).json({ message: 'An invoice already exists for this PO' });
    }

    const invoiceNumber = await generateNumber('INV', db.Invoice, 'invoice_number', transaction);

    const subtotal = parseFloat(po.subtotal);
    const totalTax = parseFloat(po.tax_amount);
    const totalAmount = parseFloat(po.total_amount);

    const { cgst_amount, sgst_amount, igst_amount } = computeGstBreakdown(
      subtotal, totalTax, po.Vendor?.state
    );

    const wordsStr = amountInWords(totalAmount);

    const invoice = await db.Invoice.create({
      invoice_number: invoiceNumber,
      po_id: purchase_order_id,          // correct FK per model
      vendor_id: po.vendor_id,
      issue_date,
      due_date,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      total_amount: totalAmount,
      amount_in_words: wordsStr,
      payment_terms: po.payment_terms,
      notes,
      status: 'draft',
      user_id: userId
    }, { transaction });

    await db.ActivityLog.create({
      entity_type: 'invoice',
      entity_id: invoice.id,
      action: 'created',
      description: `Invoice ${invoiceNumber} generated`,
      user_id: userId
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({ message: 'Invoice generated successfully', data: invoice });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/invoices — List all invoices
 */
export const getInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await db.Invoice.findAndCountAll({
      where,
      include: [
        { model: db.Vendor, attributes: ['company_name'] },
        { model: db.PurchaseOrder, attributes: ['po_number'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return res.status(200).json({
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/invoices/:id — Invoice detail with items
 */
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.Invoice.findByPk(id, {
      include: [
        { model: db.Vendor, attributes: ['company_name', 'gst_number', 'address', 'state'] },
        {
          model: db.PurchaseOrder,
          include: [
            {
              model: db.Quotation,
              include: [{ model: db.QuotationItem, include: [{ model: db.RfqItem }] }]
            }
          ]
        }
      ]
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const items = shapeItems(invoice.PurchaseOrder);

    return res.status(200).json({ invoice, items });
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * PATCH /api/invoices/:id/status — Update invoice status
 */
export const updateInvoiceStatus = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const invoice = await db.Invoice.findByPk(id, { transaction });
    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save({ transaction });

    await db.ActivityLog.create({
      entity_type: 'invoice',
      entity_id: invoice.id,
      action: `status_${status}`,
      description: `Invoice ${invoice.invoice_number} marked as ${status}`,
      user_id: userId
    }, { transaction });

    await transaction.commit();
    return res.status(200).json({ message: `Invoice status updated to ${status}` });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating invoice status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/invoices/:id/pdf — Stream PDF to client
 */
export const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.Invoice.findByPk(id, {
      include: [
        { model: db.Vendor, attributes: ['company_name', 'gst_number', 'address', 'state'] },
        {
          model: db.PurchaseOrder,
          include: [
            {
              model: db.Quotation,
              include: [{ model: db.QuotationItem, include: [{ model: db.RfqItem }] }]
            }
          ]
        }
      ]
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const items = shapeItems(invoice.PurchaseOrder);
    const pdfBuffer = await generateInvoicePdf(invoice, items, invoice.Vendor, invoice.PurchaseOrder);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

/**
 * POST /api/invoices/:id/send-email — Send invoice PDF via email
 */
export const sendInvoiceByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { to, cc, message } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!to) return res.status(400).json({ message: '`to` email is required' });

    const invoice = await db.Invoice.findByPk(id, {
      include: [
        { model: db.Vendor, attributes: ['company_name', 'gst_number', 'address', 'state'] },
        {
          model: db.PurchaseOrder,
          include: [
            {
              model: db.Quotation,
              include: [{ model: db.QuotationItem, include: [{ model: db.RfqItem }] }]
            }
          ]
        }
      ]
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const items = shapeItems(invoice.PurchaseOrder);
    const pdfBuffer = await generateInvoicePdf(invoice, items, invoice.Vendor, invoice.PurchaseOrder);

    await sendInvoiceEmail(to, cc || '', invoice.invoice_number, pdfBuffer, message);

    // Mark invoice as sent if currently draft
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      invoice.sent_at = new Date();
      invoice.sent_to_email = to;
      await invoice.save();
    }

    await db.ActivityLog.create({
      entity_type: 'invoice',
      entity_id: invoice.id,
      action: 'emailed',
      description: `Invoice ${invoice.invoice_number} sent via email to ${to}`,
      user_id: userId
    });

    return res.status(200).json({ message: `Invoice sent to ${to}` });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
};
