import db from '../models/index.js';
import { Op } from 'sequelize';

const vendorService = {
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
