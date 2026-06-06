import db from '../models/index.js';
import { Op } from 'sequelize';

const vendorService = {
  async listVendors(query = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      is_active,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    const limitVal = parseInt(limit, 10);
    const offsetVal = (parseInt(page, 10) - 1) * limitVal;

    const whereClause = { role: 'vendor' };

    if (status) {
      whereClause.status = status;
    }
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true" || is_active === true;
    }

    if (search) {
      const Op = db.Sequelize.Op;
      const searchPattern = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.iLike]: searchPattern } },
        { email: { [Op.iLike]: searchPattern } },
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Vendor,
        },
      ],
      limit: limitVal,
      offset: offsetVal,
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true,
    });

    return {
      users: rows,
      total: count,
      page: parseInt(page, 10),
      limit: limitVal,
      totalPages: Math.ceil(count / limitVal),
    };
  },

  async getVendorCategories() {
    const results = await db.Vendor.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('category')), 'category']],
      where: { category: { [Op.ne]: null } },
      paranoid: true,
      raw: true
    });
    return results.map(r => r.category).filter(Boolean).sort();
  },

  async getVendorRfqs(vendorId) {
    const rfqs = await db.RfqVendor.findAll({
      where: { vendor_id: vendorId },
      include: [{
        model: db.Rfq,
        attributes: ['id', 'rfq_number', 'title', 'status', 'deadline', 'created_at']
      }],
      order: [[db.Rfq, 'created_at', 'DESC']]
    });
    return rfqs.map(r => r.Rfq);
  },

  async getVendorQuotations(vendorId) {
    return await db.Quotation.findAll({
      where: { vendor_id: vendorId },
      include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }],
      order: [['created_at', 'DESC']]
    });
  },

  async getVendorPos(vendorId) {
    return await db.PurchaseOrder.findAll({
      where: { vendor_id: vendorId },
      include: [{
        model: db.Quotation,
        include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }]
      }],
      order: [['created_at', 'DESC']]
    });
  }
};

export default vendorService;
