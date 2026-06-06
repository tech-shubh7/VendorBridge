import db from '../models/index.js';
import { generateNumber } from '../utils/generateNumber.js';
import { sendRfqInvitationEmail } from '../utils/email.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

const rfqService = {
  async createRfq(data, userId) {
    const { title, description, deadline, items, vendor_ids, status } = data;

    const validStatuses = ["open", "draft", "under_review", "closed", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new AppError("status is not valid", STATUS_CODES.BAD_REQUEST);
    }
    if (!title || !deadline || !items || items.length === 0 || !vendor_ids || vendor_ids.length === 0 || !status) {
      throw new AppError("Missing required fields: title, deadline, items, or vendor_ids", STATUS_CODES.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const rfqNumber = await generateNumber('RFQ', db.Rfq, 'rfq_number', transaction);

      const rfq = await db.Rfq.create({
        rfq_number: rfqNumber,
        title,
        description,
        deadline,
        status,
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

      return {
        id: rfq.id,
        rfq_number: rfq.rfq_number,
        status: rfq.status
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getRfqs(query) {
    const { status, search, page = 1, limit = 20 } = query;
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

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit)
    };
  },

  async getRfqById(id) {
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
      throw new AppError('RFQ not found', STATUS_CODES.NOT_FOUND);
    }

    const quotationCount = await db.Quotation.count({
      where: { rfq_id: id, status: { [db.Sequelize.Op.ne]: 'draft' } }
    });

    return { rfq, quotation_count: quotationCount };
  },

  async publishRfq(id, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const rfq = await db.Rfq.findByPk(id, { transaction });
      
      if (!rfq) {
        throw new AppError('RFQ not found', STATUS_CODES.NOT_FOUND);
      }

      if (rfq.status !== 'draft') {
        throw new AppError('Only draft RFQs can be published', STATUS_CODES.BAD_REQUEST);
      }

      if (new Date(rfq.deadline) <= new Date()) {
        throw new AppError('Cannot publish RFQ with a deadline in the past', STATUS_CODES.BAD_REQUEST);
      }

      rfq.status = 'open';
      await rfq.save({ transaction });

      const rfqVendors = await db.RfqVendor.findAll({ 
        where: { rfq_id: id }, 
        include: [{ model: db.Vendor }],
        transaction 
      });

      for (const rv of rfqVendors) {
        rv.invitation_sent = true;
        await rv.save({ transaction });

        if (rv.Vendor && rv.Vendor.email) {
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
      return { status: rfq.status };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async closeRfq(id, userId) {
    const rfq = await db.Rfq.findByPk(id);
    if (!rfq) {
      throw new AppError('RFQ not found', STATUS_CODES.NOT_FOUND);
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

    return { status: rfq.status };
  }
};

export default rfqService;
