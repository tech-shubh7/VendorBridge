import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { amountInWords } from '../utils/amountInWords.js';
import { generateInvoicePdf } from '../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../utils/email.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

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

const invoiceService = {
  async createInvoice(data, userId) {
    const { purchase_order_id, issue_date, due_date, notes } = data;

    if (!purchase_order_id || !issue_date || !due_date) {
      throw new AppError('purchase_order_id, issue_date, and due_date are required', STATUS_CODES.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const po = await db.PurchaseOrder.findByPk(purchase_order_id, {
        include: [{ model: db.Vendor }],
        transaction
      });

      if (!po) {
        throw new AppError('Purchase Order not found', STATUS_CODES.NOT_FOUND);
      }

      if (po.status === 'draft') {
        throw new AppError('Cannot generate invoice for a draft PO. Send the PO first.', STATUS_CODES.BAD_REQUEST);
      }

      const existingInvoice = await db.Invoice.findOne({ where: { po_id: purchase_order_id }, transaction });
      if (existingInvoice) {
        throw new AppError('An invoice already exists for this PO', STATUS_CODES.CONFLICT);
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
        po_id: purchase_order_id,
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
      return invoice;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getInvoices(query) {
    const { status, page = 1, limit = 20 } = query;
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

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit)
    };
  },

  async getInvoiceById(id) {
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

    if (!invoice) {
      throw new AppError('Invoice not found', STATUS_CODES.NOT_FOUND);
    }

    const items = shapeItems(invoice.PurchaseOrder);
    return { invoice, items };
  },

  async updateInvoiceStatus(id, status, userId) {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, STATUS_CODES.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const invoice = await db.Invoice.findByPk(id, { transaction });
      if (!invoice) {
        throw new AppError('Invoice not found', STATUS_CODES.NOT_FOUND);
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
      return { message: `Invoice status updated to ${status}` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getInvoicePdfBuffer(id) {
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

    if (!invoice) {
      throw new AppError('Invoice not found', STATUS_CODES.NOT_FOUND);
    }

    const items = shapeItems(invoice.PurchaseOrder);
    const pdfBuffer = await generateInvoicePdf(invoice, items, invoice.Vendor, invoice.PurchaseOrder);
    return { pdfBuffer, invoiceNumber: invoice.invoice_number };
  },

  async sendInvoiceByEmail(id, emailDetails, userId) {
    const { to, cc, message } = emailDetails;
    if (!to) {
      throw new AppError('`to` email is required', STATUS_CODES.BAD_REQUEST);
    }

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

    if (!invoice) {
      throw new AppError('Invoice not found', STATUS_CODES.NOT_FOUND);
    }

    const items = shapeItems(invoice.PurchaseOrder);
    const pdfBuffer = await generateInvoicePdf(invoice, items, invoice.Vendor, invoice.PurchaseOrder);

    await sendInvoiceEmail(to, cc || '', invoice.invoice_number, pdfBuffer, message);

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

    return { message: `Invoice sent to ${to}` };
  }
};

export default invoiceService;
