import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { sendRfqInvitationEmail } from '../utils/email.js';

/**
 * Creates a new RFQ as draft
 */
export const createRfq = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { title, description, deadline, items, vendor_ids } = req.body;
    
    // Fallback user ID for testing if auth middleware isn't fully active yet
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!title || !deadline || !items || items.length === 0 || !vendor_ids || vendor_ids.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: title, deadline, items, or vendor_ids' });
    }

    const rfqNumber = await generateNumber('RFQ', db.Rfq, 'rfq_number', transaction);

    const rfq = await db.Rfq.create({
      rfq_number: rfqNumber,
      title,
      description,
      deadline,
      status: 'draft',
      user_id: userId
    }, { transaction });

    const rfqItemsData = items.map((item, index) => ({
      rfq_id: rfq.id,
      item_name: item.item_name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      specifications: item.specifications,
      sort_order: index
    }));
    await db.RfqItem.bulkCreate(rfqItemsData, { transaction });

    const rfqVendorsData = vendor_ids.map(vendor_id => ({
      rfq_id: rfq.id,
      vendor_id
    }));
    await db.RfqVendor.bulkCreate(rfqVendorsData, { transaction });

    await db.ActivityLog.create({
      entity_type: 'rfq',
      entity_id: rfq.id,
      action: 'created',
      description: `RFQ ${rfqNumber} created as draft`,
      user_id: userId
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'RFQ created successfully',
      data: {
        id: rfq.id,
        rfq_number: rfq.rfq_number,
        status: rfq.status
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating RFQ:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Lists RFQs with optional status filter
 */
export const getRfqs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { rfq_number: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await db.Rfq.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
      attributes: {
        include: [
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM rfq_vendors
              WHERE rfq_vendors.rfq_id = "Rfq".id
            )`),
            'vendors_invited_count'
          ],
          [
            db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM quotations
              WHERE quotations.rfq_id = "Rfq".id AND quotations.status != 'draft'
            )`),
            'quotations_received_count'
          ]
        ]
      }
    });

    return res.status(200).json({
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listing RFQs:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Gets detail of a specific RFQ
 */
export const getRfqById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rfq = await db.Rfq.findOne({
      where: { id },
      include: [
        {
          model: db.RfqItem,
          attributes: ['id', 'item_name', 'description', 'quantity', 'unit', 'specifications']
        },
        {
          model: db.RfqVendor,
          include: [{
            model: db.Vendor,
            attributes: ['id', 'company_name', 'email']
          }]
        }
      ]
    });

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const quotationCount = await db.Quotation.count({
      where: { rfq_id: id, status: { [db.Sequelize.Op.ne]: 'draft' } }
    });

    return res.status(200).json({
      rfq,
      quotation_count: quotationCount
    });
  } catch (error) {
    console.error('Error fetching RFQ detail:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Publishes a draft RFQ
 */
export const publishRfq = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const rfq = await db.Rfq.findByPk(id, { transaction });
    
    if (!rfq) {
      await transaction.rollback();
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Only draft RFQs can be published' });
    }

    if (new Date(rfq.deadline) <= new Date()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot publish RFQ with a deadline in the past' });
    }

    rfq.status = 'open';
    await rfq.save({ transaction });

    // Mark all rfq_vendors as invitation_sent, create notifications, and send email
    const rfqVendors = await db.RfqVendor.findAll({ 
      where: { rfq_id: id }, 
      include: [{ model: db.Vendor }],
      transaction 
    });
    for (const rv of rfqVendors) {
      rv.invitation_sent = true;
      await rv.save({ transaction });

      if (rv.Vendor && rv.Vendor.email) {
        // Send email non-blocking
        sendRfqInvitationEmail(rv.Vendor.email, rfq.rfq_number, rfq.title, rfq.id)
          .catch(err => console.error('Error sending RFQ email:', err));
      }
    }

    await db.ActivityLog.create({
      entity_type: 'rfq',
      entity_id: rfq.id,
      action: 'published',
      description: `RFQ ${rfq.rfq_number} published`,
      user_id: userId
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({ message: 'RFQ published successfully', status: rfq.status });
  } catch (error) {
    await transaction.rollback();
    console.error('Error publishing RFQ:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Closes an open RFQ
 */
export const closeRfq = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const rfq = await db.Rfq.findByPk(id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    rfq.status = 'closed';
    await rfq.save();

    await db.ActivityLog.create({
      entity_type: 'rfq',
      entity_id: rfq.id,
      action: 'closed',
      description: `RFQ ${rfq.rfq_number} manually closed`,
      user_id: userId
    });

    return res.status(200).json({ message: 'RFQ closed successfully', status: rfq.status });
  } catch (error) {
    console.error('Error closing RFQ:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
