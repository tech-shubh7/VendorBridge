import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

const poService = {
  async createPurchaseOrder(data, userId) {
    const { 
      quotation_id, 
      delivery_date, 
      payment_terms, 
      terms_and_conditions, 
      billing_address, 
      shipping_address 
    } = data;

    const transaction = await db.sequelize.transaction();
    try {
      const quotation = await db.Quotation.findByPk(quotation_id, { transaction });
      if (!quotation) {
        throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
      }

      if (quotation.status !== 'accepted') {
        throw new AppError('Only accepted quotations can be converted to a PO', STATUS_CODES.BAD_REQUEST);
      }

      const existingPo = await db.PurchaseOrder.findOne({ where: { quotation_id }, transaction });
      if (existingPo) {
        throw new AppError('A Purchase Order already exists for this quotation', STATUS_CODES.CONFLICT);
      }

      const itemsWithRfq = await db.QuotationItem.findAll({
        where: { quotation_id },
        include: [db.RfqItem],
        transaction
      });

      let subtotal = 0;
      let tax_amount = 0;

      itemsWithRfq.forEach(item => {
        const qty = item.RfqItem ? item.RfqItem.quantity : 1;
        subtotal += (item.unit_price * qty);
        tax_amount += parseFloat(item.tax_amount);
      });

      const total_amount = subtotal + tax_amount;
      const poNumber = await generateNumber('PO', db.PurchaseOrder, 'po_number', transaction);

      const po = await db.PurchaseOrder.create({
        po_number: poNumber,
        quotation_id,
        vendor_id: quotation.vendor_id,
        delivery_date,
        payment_terms,
        terms_and_conditions,
        billing_address,
        shipping_address,
        subtotal,
        tax_amount,
        total_amount,
        status: 'draft',
        user_id: userId
      }, { transaction });

      await db.ActivityLog.create({
        entity_type: 'po',
        entity_id: po.id,
        action: 'created',
        description: `Purchase Order ${poNumber} generated`,
        user_id: userId
      }, { transaction });

      await transaction.commit();
      return po;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getPurchaseOrders() {
    return await db.PurchaseOrder.findAll({
      include: [
        { model: db.Vendor, attributes: ['company_name'] },
        { 
          model: db.Quotation, 
          include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
  },

  async getPurchaseOrderById(id) {
    const po = await db.PurchaseOrder.findByPk(id, {
      include: [
        { model: db.Vendor, attributes: ['company_name', 'gst_number', 'email'] },
        { 
          model: db.Quotation, 
          include: [
            { model: db.Rfq, attributes: ['rfq_number', 'title'] },
            { model: db.QuotationItem, include: [{ model: db.RfqItem }] }
          ] 
        }
      ]
    });

    if (!po) {
      throw new AppError('Purchase Order not found', STATUS_CODES.NOT_FOUND);
    }
    
    const items = po.Quotation.QuotationItems.map(qi => ({
      item_name: qi.RfqItem.item_name,
      quantity: qi.RfqItem.quantity,
      unit: qi.RfqItem.unit,
      unit_price: qi.unit_price,
      tax_percent: qi.tax_percent,
      tax_amount: qi.tax_amount,
      total_price: qi.total_price
    }));

    return { po, items };
  },

  async updatePurchaseOrder(id, data) {
    const { delivery_date, payment_terms, terms_and_conditions, billing_address, shipping_address } = data;

    const po = await db.PurchaseOrder.findByPk(id);
    if (!po) {
      throw new AppError('Purchase Order not found', STATUS_CODES.NOT_FOUND);
    }
    
    if (po.status !== 'draft') {
      throw new AppError('Only draft POs can be edited', STATUS_CODES.BAD_REQUEST);
    }

    await po.update({
      delivery_date,
      payment_terms,
      terms_and_conditions,
      billing_address,
      shipping_address
    });

    return { message: 'Purchase Order updated successfully' };
  },

  async sendPurchaseOrder(id, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const po = await db.PurchaseOrder.findByPk(id, { transaction });
      if (!po) {
        throw new AppError('Purchase Order not found', STATUS_CODES.NOT_FOUND);
      }

      if (po.status !== 'draft') {
        throw new AppError('PO is already sent or processed', STATUS_CODES.BAD_REQUEST);
      }

      po.status = 'sent';
      await po.save({ transaction });

      await db.ActivityLog.create({
        entity_type: 'po',
        entity_id: po.id,
        action: 'sent',
        description: `Purchase Order ${po.po_number} sent to vendor`,
        user_id: userId
      }, { transaction });

      await transaction.commit();
      return { status: po.status };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

export default poService;
