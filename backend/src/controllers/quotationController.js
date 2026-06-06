import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { sendEmail } from '../utils/email.js'; // Assuming we'll send email on submit

/**
 * Server-side calculation of taxes and totals for quotation items
 */
const calculateTotals = (items) => {
  let grandTotal = 0;
  const processedItems = items.map(item => {
    const taxAmount = parseFloat((item.unit_price * item.quantity * (item.tax_percent / 100)).toFixed(2));
    const totalPrice = parseFloat((item.unit_price * item.quantity + taxAmount).toFixed(2));
    grandTotal += totalPrice;

    return {
      ...item,
      tax_amount: taxAmount,
      total_price: totalPrice
    };
  });
  return { processedItems, grandTotal: parseFloat(grandTotal.toFixed(2)) };
};

/**
 * Creates or saves a draft quotation (Vendor side)
 */
export const createQuotation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { rfq_id, vendor_id, delivery_days, payment_terms, valid_until, notes, items } = req.body;

    // Fallback user logic
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    // If auth is working, we extract vendor_id differently. For now, reading from body.

    // 1. Validate RFQ is open
    const rfq = await db.Rfq.findByPk(rfq_id, { transaction });
    if (!rfq) {
      await transaction.rollback();
      return res.status(404).json({ message: 'RFQ not found' });
    }
    if (rfq.status !== 'open') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Quotations can only be submitted for open RFQs' });
    }

    // 2. Validate Vendor is invited to this RFQ
    const rfqVendor = await db.RfqVendor.findOne({ where: { rfq_id, vendor_id }, transaction });
    if (!rfqVendor) {
      await transaction.rollback();
      return res.status(403).json({ message: 'You are not invited to this RFQ' });
    }

    // 3. Ensure no existing quotation
    const existingQuotation = await db.Quotation.findOne({ where: { rfq_id, vendor_id }, transaction });
    if (existingQuotation) {
      await transaction.rollback();
      return res.status(409).json({ message: 'A quotation for this RFQ already exists from this vendor' });
    }

    // Generate QT number
    const quotationNumber = await generateNumber('QT', db.Quotation, 'quotation_number', transaction);

    // Calculate totals
    const { processedItems, grandTotal } = calculateTotals(items);

    // Create Quotation
    const quotation = await db.Quotation.create({
      quotation_number: quotationNumber,
      rfq_id,
      vendor_id,
      status: 'draft',
      delivery_days,
      payment_terms,
      valid_until,
      notes,
      total_amount: grandTotal,
      submitted_by: userId
    }, { transaction });

    // Insert Items
    const quotationItemsData = processedItems.map(item => ({
      quotation_id: quotation.id,
      rfq_item_id: item.rfq_item_id,
      unit_price: item.unit_price,
      tax_percent: item.tax_percent,
      tax_amount: item.tax_amount,
      total_price: item.total_price,
      delivery_days: item.delivery_days
    }));
    await db.QuotationItem.bulkCreate(quotationItemsData, { transaction });

    await db.ActivityLog.create({
      entity_type: 'quotation',
      entity_id: quotation.id,
      action: 'created',
      description: `Draft quotation ${quotationNumber} saved`,
      user_id: userId
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Draft quotation saved successfully',
      data: quotation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating quotation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Updates a draft quotation
 */
export const updateQuotation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { delivery_days, payment_terms, valid_until, notes, items } = req.body;

    const quotation = await db.Quotation.findByPk(id, { transaction });
    if (!quotation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status !== 'draft') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only draft quotations can be edited' });
    }

    const { processedItems, grandTotal } = calculateTotals(items);

    await quotation.update({
      delivery_days,
      payment_terms,
      valid_until,
      notes,
      total_amount: grandTotal
    }, { transaction });

    // Replace items
    await db.QuotationItem.destroy({ where: { quotation_id: id }, transaction });

    const quotationItemsData = processedItems.map(item => ({
      quotation_id: quotation.id,
      rfq_item_id: item.rfq_item_id,
      unit_price: item.unit_price,
      tax_percent: item.tax_percent,
      tax_amount: item.tax_amount,
      total_price: item.total_price,
      delivery_days: item.delivery_days
    }));
    await db.QuotationItem.bulkCreate(quotationItemsData, { transaction });

    await transaction.commit();

    return res.status(200).json({ message: 'Quotation updated successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating quotation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Submits a draft quotation (locks it)
 */
export const submitQuotation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const quotation = await db.Quotation.findByPk(id, { transaction });
    if (!quotation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Quotation is already submitted or in review' });
    }

    quotation.status = 'submitted';
    quotation.submitted_at = new Date();
    await quotation.save({ transaction });

    await db.ActivityLog.create({
      entity_type: 'quotation',
      entity_id: quotation.id,
      action: 'submitted',
      description: `Quotation ${quotation.quotation_number} submitted`,
      user_id: userId
    }, { transaction });

    // Optionally fetch procurement officer(s) email to notify them here.
    // ...

    await transaction.commit();
    return res.status(200).json({ message: 'Quotation submitted successfully', status: 'submitted' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error submitting quotation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Vendor portal: "My RFQs" — all RFQs vendor was invited to
 * Shows submission status per RFQ: open (no quotation) | draft | submitted
 */
export const getMyRfqs = async (req, res) => {
  try {
    const { vendor_id } = req.query; // will come from req.user.vendor_id when auth is ready

    const rfqVendors = await db.RfqVendor.findAll({
      where: { vendor_id },
      include: [{
        model: db.Rfq,
        attributes: ['id', 'rfq_number', 'title', 'status', 'deadline']
      }],
      order: [[db.Rfq, 'created_at', 'DESC']]
    });

    const result = await Promise.all(rfqVendors.map(async (rv) => {
      const quotation = await db.Quotation.findOne({
        where: { rfq_id: rv.Rfq.id, vendor_id },
        attributes: ['id', 'quotation_number', 'status']
      });
      return {
        rfq: rv.Rfq,
        invitation_sent: rv.invitation_sent,
        quotation_status: quotation ? quotation.status : null,
        quotation_id: quotation ? quotation.id : null,
        can_submit: rv.Rfq.status === 'open' && !quotation
      };
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching vendor RFQs:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * List quotations (role-filtered generally, here all for testing)
 */
export const getQuotations = async (req, res) => {
  try {
    const quotations = await db.Quotation.findAll({
      include: [
        { model: db.Rfq, attributes: ['rfq_number', 'title', 'status'] },
        { model: db.Vendor, attributes: ['company_name', 'email'] }
      ]
    });
    return res.status(200).json({ data: quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get quotation detail
 */
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await db.Quotation.findByPk(id, {
      include: [
        { model: db.QuotationItem },
        { model: db.Rfq, attributes: ['rfq_number', 'title', 'status'] },
        { model: db.Vendor, attributes: ['company_name'] }
      ]
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    return res.status(200).json({ data: quotation });
  } catch (error) {
    console.error('Error fetching quotation detail:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get all quotations for a specific RFQ
 */
export const getRfqQuotations = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const quotations = await db.Quotation.findAll({
      where: { rfq_id: rfqId },
      include: [
        { model: db.Vendor, attributes: ['company_name', 'email', 'rating'] }
      ]
    });
    return res.status(200).json({ data: quotations });
  } catch (error) {
    console.error('Error fetching RFQ quotations:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Compare endpoint
 */
export const compareQuotations = async (req, res) => {
  try {
    const { rfqId } = req.params;

    const rfq = await db.Rfq.findByPk(rfqId, {
      include: [{ model: db.RfqItem }]
    });

    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

    const quotations = await db.Quotation.findAll({
      where: { rfq_id: rfqId, status: { [db.Sequelize.Op.ne]: 'draft' } },
      include: [
        { model: db.Vendor, attributes: ['id', 'company_name', 'rating'] },
        { model: db.QuotationItem, include: [{ model: db.RfqItem, attributes: ['item_name'] }] }
      ]
    });

    // Determine lowest price per item
    const lowestPrices = {}; // rfq_item_id -> lowest unit_price

    quotations.forEach(q => {
      q.QuotationItems.forEach(qi => {
        if (!lowestPrices[qi.rfq_item_id] || qi.unit_price < lowestPrices[qi.rfq_item_id]) {
          lowestPrices[qi.rfq_item_id] = qi.unit_price;
        }
      });
    });

    // Format output
    let lowestTotalQuotationId = null;
    let lowestTotal = Infinity;

    let fastestDeliveryQuotationId = null;
    let fastestDelivery = Infinity;

    const formattedQuotations = quotations.map(q => {
      if (q.total_amount < lowestTotal) {
        lowestTotal = q.total_amount;
        lowestTotalQuotationId = q.id;
      }
      if (q.delivery_days < fastestDelivery) {
        fastestDelivery = q.delivery_days;
        fastestDeliveryQuotationId = q.id;
      }

      const items = q.QuotationItems.map(qi => ({
        id: qi.id,
        rfq_item_id: qi.rfq_item_id,
        item_name: qi.RfqItem ? qi.RfqItem.item_name : '',
        unit_price: qi.unit_price,
        tax_percent: qi.tax_percent,
        tax_amount: qi.tax_amount,
        total_price: qi.total_price,
        delivery_days: qi.delivery_days,
        is_lowest_price: qi.unit_price === lowestPrices[qi.rfq_item_id]
      }));

      return {
        id: q.id,
        quotation_number: q.quotation_number,
        status: q.status,
        vendor: q.Vendor,
        delivery_days: q.delivery_days,
        payment_terms: q.payment_terms,
        total_amount: q.total_amount,
        items
      };
    });

    return res.status(200).json({
      rfq: {
        id: rfq.id,
        title: rfq.title,
        items: rfq.RfqItems
      },
      quotations: formattedQuotations,
      analysis: {
        lowest_total_quotation_id: lowestTotalQuotationId,
        fastest_delivery_quotation_id: fastestDeliveryQuotationId
      }
    });

  } catch (error) {
    console.error('Error comparing quotations:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
