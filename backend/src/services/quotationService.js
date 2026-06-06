import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

const calculateTotals = (items) => {
  let grandTotal = 0;
  const processedItems = items.map(item => {
    const taxP = item.tax_percent || 0;
    const qty = item.quantity || 1;
    const taxAmount = parseFloat((item.unit_price * qty * (taxP / 100)).toFixed(2));
    const totalPrice = parseFloat((item.unit_price * qty + taxAmount).toFixed(2));
    grandTotal += totalPrice;

    return {
      ...item,
      tax_amount: taxAmount,
      total_price: totalPrice
    };
  });
  return { processedItems, grandTotal: parseFloat(grandTotal.toFixed(2)) };
};

const quotationService = {
  async createQuotation(data, userId) {
    const { rfq_id, delivery_days, payment_terms, valid_until, notes, items } = data;
    let vendor_id = data.vendor_id;

    if (!vendor_id) {
      const vendor = await db.Vendor.findOne({ where: { user_id: userId } });
      if (!vendor) {
        throw new AppError('Vendor context not found for this user. Please provide vendor_id.', STATUS_CODES.BAD_REQUEST);
      }
      vendor_id = vendor.id;
    }

    const transaction = await db.sequelize.transaction();
    try {
      const rfq = await db.Rfq.findByPk(rfq_id, { 
        include: [{ model: db.RfqItem }],
        transaction 
      });
      if (!rfq) {
        throw new AppError('RFQ not found', STATUS_CODES.NOT_FOUND);
      }
      if (rfq.status !== 'open') {
        throw new AppError('Quotations can only be submitted for open RFQs', STATUS_CODES.BAD_REQUEST);
      }

      const rfqVendor = await db.RfqVendor.findOne({ where: { rfq_id, vendor_id }, transaction });
      if (!rfqVendor) {
        throw new AppError('You are not invited to this RFQ', STATUS_CODES.FORBIDDEN);
      }

      const existingQuotation = await db.Quotation.findOne({ where: { rfq_id, vendor_id }, transaction });
      if (existingQuotation) {
        throw new AppError('A quotation for this RFQ already exists from this vendor', STATUS_CODES.CONFLICT);
      }

      const quotationNumber = await generateNumber('QT', db.Quotation, 'quotation_number', transaction);
      const { processedItems, grandTotal } = calculateTotals(items);

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
        user_id: userId
      }, { transaction });

      const rfqItemsMap = {};
      rfq.RfqItems.forEach(ri => rfqItemsMap[ri.id] = ri);

      const quotationItemsData = processedItems.map(item => {
        const rfqItem = rfqItemsMap[item.rfq_item_id];
        if (!rfqItem) throw new AppError(`Invalid rfq_item_id: ${item.rfq_item_id}`, STATUS_CODES.BAD_REQUEST);

        return {
          quotation_id: quotation.id,
          rfq_item_id: item.rfq_item_id,
          item_name: rfqItem.item_name,
          quantity: item.quantity || rfqItem.quantity,
          unit: rfqItem.unit,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent || 0,
          tax_amount: item.tax_amount,
          total_price: item.total_price,
          delivery_days: item.delivery_days,
          notes: item.notes
        };
      });
      await db.QuotationItem.bulkCreate(quotationItemsData, { transaction });

      await db.ActivityLog.create({
        entity_type: 'quotation',
        entity_id: quotation.id,
        action: 'created',
        description: `Draft quotation ${quotationNumber} saved`,
        user_id: userId
      }, { transaction });

      await transaction.commit();
      return quotation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async updateQuotation(id, data) {
    const { delivery_days, payment_terms, valid_until, notes, items } = data;

    const transaction = await db.sequelize.transaction();
    try {
      const quotation = await db.Quotation.findByPk(id, { transaction });
      if (!quotation) {
        throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
      }

      if (quotation.status !== 'draft') {
        throw new AppError('Only draft quotations can be edited', STATUS_CODES.FORBIDDEN);
      }

      const { processedItems, grandTotal } = calculateTotals(items);

      await quotation.update({
        delivery_days,
        payment_terms,
        valid_until,
        notes,
        total_amount: grandTotal
      }, { transaction });

      await db.QuotationItem.destroy({ where: { quotation_id: id }, transaction });

      const rfq = await db.Rfq.findByPk(quotation.rfq_id, {
        include: [{ model: db.RfqItem }],
        transaction
      });
      const rfqItemsMap = {};
      rfq.RfqItems.forEach(ri => rfqItemsMap[ri.id] = ri);

      const quotationItemsData = processedItems.map(item => {
        const rfqItem = rfqItemsMap[item.rfq_item_id];
        if (!rfqItem) throw new AppError(`Invalid rfq_item_id: ${item.rfq_item_id}`, STATUS_CODES.BAD_REQUEST);

        return {
          quotation_id: quotation.id,
          rfq_item_id: item.rfq_item_id,
          item_name: rfqItem.item_name,
          quantity: item.quantity || rfqItem.quantity,
          unit: rfqItem.unit,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent || 0,
          tax_amount: item.tax_amount,
          total_price: item.total_price,
          delivery_days: item.delivery_days,
          notes: item.notes
        };
      });
      await db.QuotationItem.bulkCreate(quotationItemsData, { transaction });

      await transaction.commit();
      return { message: 'Quotation updated successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async submitQuotation(id, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const quotation = await db.Quotation.findByPk(id, { transaction });
      if (!quotation) {
        throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
      }

      if (quotation.status !== 'draft') {
        throw new AppError('Quotation is already submitted or in review', STATUS_CODES.BAD_REQUEST);
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

      await transaction.commit();
      return { status: 'submitted' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getMyRfqs(vendorId) {
    const rfqVendors = await db.RfqVendor.findAll({
      where: { vendor_id: vendorId },
      include: [{
        model: db.Rfq,
        attributes: ['id', 'rfq_number', 'title', 'status', 'deadline']
      }],
      order: [[db.Rfq, 'created_at', 'DESC']]
    });

    return await Promise.all(rfqVendors.map(async (rv) => {
      const quotation = await db.Quotation.findOne({
        where: { rfq_id: rv.Rfq.id, vendor_id: vendorId },
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
  },

  async getQuotations() {
    return await db.Quotation.findAll({
      include: [
        { model: db.Rfq, attributes: ['rfq_number', 'title', 'status'] },
        { model: db.Vendor, attributes: ['company_name', 'email'] }
      ]
    });
  },

  async getQuotationById(id) {
    const quotation = await db.Quotation.findByPk(id, {
      include: [
        { model: db.QuotationItem },
        { model: db.Rfq, attributes: ['rfq_number', 'title', 'status'] },
        { model: db.Vendor, attributes: ['company_name'] }
      ]
    });
    if (!quotation) {
      throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
    }
    return quotation;
  },

  async getRfqQuotations(rfqId) {
    return await db.Quotation.findAll({
      where: { rfq_id: rfqId },
      include: [
        { model: db.Vendor, attributes: ['company_name', 'email', 'rating'] }
      ]
    });
  },

  async compareQuotations(rfqId) {
    const rfq = await db.Rfq.findByPk(rfqId, {
      include: [{ model: db.RfqItem }]
    });

    if (!rfq) {
      throw new AppError('RFQ not found', STATUS_CODES.NOT_FOUND);
    }

    const quotations = await db.Quotation.findAll({
      where: { rfq_id: rfqId, status: { [db.Sequelize.Op.ne]: 'draft' } },
      include: [
        { model: db.Vendor, attributes: ['id', 'company_name', 'rating'] },
        { model: db.QuotationItem, include: [{ model: db.RfqItem, attributes: ['item_name'] }] }
      ]
    });

    const lowestPrices = {};

    quotations.forEach(q => {
      q.QuotationItems.forEach(qi => {
        if (!lowestPrices[qi.rfq_item_id] || qi.unit_price < lowestPrices[qi.rfq_item_id]) {
          lowestPrices[qi.rfq_item_id] = qi.unit_price;
        }
      });
    });

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

    return {
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
    };
  }
};

export default quotationService;
