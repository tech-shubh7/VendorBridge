import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';

/**
 * Generate PO from approved quotation
 */
export const createPurchaseOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { 
      quotation_id, 
      delivery_date, 
      payment_terms, 
      terms_and_conditions, 
      billing_address, 
      shipping_address 
    } = req.body;
    
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const quotation = await db.Quotation.findByPk(quotation_id, { transaction });
    if (!quotation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status !== 'accepted') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Only accepted quotations can be converted to a PO' });
    }

    const existingPo = await db.PurchaseOrder.findOne({ where: { quotation_id }, transaction });
    if (existingPo) {
      await transaction.rollback();
      return res.status(409).json({ message: 'A Purchase Order already exists for this quotation' });
    }

    const items = await db.QuotationItem.findAll({ where: { quotation_id }, transaction });
    
    let subtotal = 0;
    let tax_amount = 0;
    
    items.forEach(item => {
      // Re-calculating correctly based on unit_price * qty
      // Wait: quotationItem does not have quantity natively, it gets it from rfq_item
      // Let's fetch the RfqItem to get quantity!
    });
    
    // So we need to include RfqItem
    const itemsWithRfq = await db.QuotationItem.findAll({
      where: { quotation_id },
      include: [db.RfqItem],
      transaction
    });

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
    return res.status(201).json({ message: 'Purchase Order generated successfully', data: po });
  } catch (error) {
    await transaction.rollback();
    console.error('Error generating PO:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * List Purchase Orders
 */
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await db.PurchaseOrder.findAll({
      include: [
        { model: db.Vendor, attributes: ['company_name'] },
        { 
          model: db.Quotation, 
          include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json({ data: pos });
  } catch (error) {
    console.error('Error listing POs:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get Purchase Order Detail
 */
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    
    // Formatting the items nicely for the UI
    const items = po.Quotation.QuotationItems.map(qi => ({
      item_name: qi.RfqItem.item_name,
      quantity: qi.RfqItem.quantity,
      unit: qi.RfqItem.unit,
      unit_price: qi.unit_price,
      tax_percent: qi.tax_percent,
      tax_amount: qi.tax_amount,
      total_price: qi.total_price
    }));

    return res.status(200).json({ po, items });
  } catch (error) {
    console.error('Error fetching PO detail:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Update draft PO
 */
export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, payment_terms, terms_and_conditions, billing_address, shipping_address } = req.body;

    const po = await db.PurchaseOrder.findByPk(id);
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    
    if (po.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft POs can be edited' });
    }

    await po.update({
      delivery_date,
      payment_terms,
      terms_and_conditions,
      billing_address,
      shipping_address
    });

    return res.status(200).json({ message: 'Purchase Order updated successfully' });
  } catch (error) {
    console.error('Error updating PO:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Send PO to Vendor
 */
export const sendPurchaseOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const po = await db.PurchaseOrder.findByPk(id, { transaction });
    if (!po) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    if (po.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ message: 'PO is already sent or processed' });
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
    return res.status(200).json({ message: 'Purchase Order sent to vendor', status: po.status });
  } catch (error) {
    await transaction.rollback();
    console.error('Error sending PO:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
