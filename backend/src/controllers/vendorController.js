import db from '../models/index.js';
import AppError from '../utils/appError.js';
import { Op } from 'sequelize';

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;

// ─── List with search + filter + pagination ──────────────────────────────────
export const getVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { deleted_at: null };

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { gst_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await db.Vendor.findAndCountAll({
      where,
      paranoid: true,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('Error listing vendors:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Distinct categories for filter dropdown ─────────────────────────────────
export const getVendorCategories = async (req, res) => {
  try {
    const results = await db.Vendor.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('category')), 'category']],
      where: { category: { [Op.ne]: null } },
      paranoid: true,
      raw: true
    });
    const categories = results.map(r => r.category).filter(Boolean).sort();
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Vendor detail ────────────────────────────────────────────────────────────
export const getVendorById = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id, { paranoid: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    return res.status(200).json({ data: vendor });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Create vendor ────────────────────────────────────────────────────────────
export const createVendor = async (req, res) => {
  try {
    const {
      company_name, category, contact_person, email, phone,
      gst_number, address, city, state, notes, status = 'active'
    } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!company_name || !contact_person || !email) {
      return res.status(400).json({ message: 'company_name, contact_person, and email are required' });
    }

    if (gst_number && !GSTIN_REGEX.test(gst_number)) {
      return res.status(400).json({ message: 'Invalid GSTIN format' });
    }

    const existing = await db.Vendor.findOne({ where: { email, deleted_at: null }, paranoid: false });
    if (existing && !existing.deleted_at) {
      return res.status(409).json({ message: 'A vendor with this email already exists' });
    }

    const vendor = await db.Vendor.create({
      company_name, category, contact_person, email, phone,
      gst_number, address, city, state, notes, status, user_id: userId
    });

    await db.ActivityLog.create({
      entity_type: 'vendor',
      entity_id: vendor.id,
      action: 'created',
      description: `Vendor ${company_name} created`,
      user_id: userId
    });

    return res.status(201).json({ message: 'Vendor created successfully', data: vendor });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Update vendor ────────────────────────────────────────────────────────────
export const updateVendor = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id, { paranoid: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const { gst_number } = req.body;
    if (gst_number && !GSTIN_REGEX.test(gst_number)) {
      return res.status(400).json({ message: 'Invalid GSTIN format' });
    }

    await vendor.update(req.body);
    return res.status(200).json({ message: 'Vendor updated successfully', data: vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Patch status (active / inactive / blacklisted) ──────────────────────────
export const updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'inactive', 'blacklisted'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${valid.join(', ')}` });
    }
    const vendor = await db.Vendor.findByPk(req.params.id, { paranoid: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    vendor.status = status;
    await vendor.save();
    return res.status(200).json({ message: `Vendor status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Soft delete (admin only) ─────────────────────────────────────────────────
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id, { paranoid: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    await vendor.destroy(); // Sequelize paranoid = soft delete
    return res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Sub-routes ───────────────────────────────────────────────────────────────

export const getVendorRfqs = async (req, res) => {
  try {
    const { id } = req.params;
    const rfqs = await db.RfqVendor.findAll({
      where: { vendor_id: id },
      include: [{
        model: db.Rfq,
        attributes: ['id', 'rfq_number', 'title', 'status', 'deadline', 'created_at']
      }],
      order: [[db.Rfq, 'created_at', 'DESC']]
    });
    return res.status(200).json({ data: rfqs.map(r => r.Rfq) });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getVendorQuotations = async (req, res) => {
  try {
    const { id } = req.params;
    const quotations = await db.Quotation.findAll({
      where: { vendor_id: id },
      include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json({ data: quotations });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getVendorPos = async (req, res) => {
  try {
    const { id } = req.params;
    const pos = await db.PurchaseOrder.findAll({
      where: { vendor_id: id },
      include: [{
        model: db.Quotation,
        include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }]
      }],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json({ data: pos });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
