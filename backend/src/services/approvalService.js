import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

const approvalService = {
  async initiateApproval(data, userId) {
    const { quotation_id, approver_id } = data;

    if (!quotation_id || !approver_id) {
      throw new AppError('quotation_id and approver_id are required', STATUS_CODES.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const quotation = await db.Quotation.findByPk(quotation_id, { transaction });
      if (!quotation) {
        throw new AppError('Quotation not found', STATUS_CODES.NOT_FOUND);
      }

      if (quotation.status !== 'submitted') {
        throw new AppError('Only submitted quotations can be sent for approval', STATUS_CODES.BAD_REQUEST);
      }

      const existingApproval = await db.Approval.findOne({ where: { quotation_id }, transaction });
      if (existingApproval) {
        throw new AppError('An approval already exists for this quotation', STATUS_CODES.CONFLICT);
      }

      const approval = await db.Approval.create({
        quotation_id,
        user_id: userId,
        approved_by: approver_id,
        status: 'pending'
      }, { transaction });

      quotation.status = 'under_review';
      await quotation.save({ transaction });

      await db.ActivityLog.create({
        entity_type: 'approval',
        entity_id: approval.id,
        action: 'initiated',
        description: `Approval initiated for quotation ${quotation.quotation_number}`,
        user_id: userId
      }, { transaction });

      await transaction.commit();

      return {
        id: approval.id,
        status: approval.status
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getApprovals() {
    return await db.Approval.findAll({
      include: [
        { 
          model: db.Quotation, 
          attributes: ['quotation_number', 'total_amount'],
          include: [
            { model: db.Rfq, attributes: ['rfq_number', 'title'] },
            { model: db.Vendor, attributes: ['company_name'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  },

  async getApprovalById(id) {
    const approval = await db.Approval.findByPk(id, {
      include: [
        { 
          model: db.Quotation,
          include: [
            { model: db.QuotationItem, include: [{ model: db.RfqItem, attributes: ['item_name'] }] },
            { model: db.Vendor, attributes: ['company_name', 'rating', 'gst_number'] }
          ]
        }
      ]
    });

    if (!approval) {
      throw new AppError('Approval not found', STATUS_CODES.NOT_FOUND);
    }

    return {
      approval: {
        id: approval.id,
        status: approval.status,
        initiated_at: approval.created_at,
        initiated_by: approval.user_id,
        remarks: approval.remarks,
        acted_at: approval.acted_at
      },
      quotation: {
        id: approval.Quotation.id,
        quotation_number: approval.Quotation.quotation_number,
        total_amount: approval.Quotation.total_amount,
        delivery_days: approval.Quotation.delivery_days,
        payment_terms: approval.Quotation.payment_terms,
        notes: approval.Quotation.notes,
        items: approval.Quotation.QuotationItems
      },
      vendor: approval.Quotation.Vendor
    };
  },

  async approveQuotation(id, remarks, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const approval = await db.Approval.findByPk(id, { include: [db.Quotation], transaction });
      if (!approval) {
        throw new AppError('Approval not found', STATUS_CODES.NOT_FOUND);
      }

      if (approval.status !== 'pending') {
        throw new AppError(`Approval is already ${approval.status}`, STATUS_CODES.BAD_REQUEST);
      }

      approval.status = 'approved';
      approval.remarks = remarks;
      approval.acted_at = new Date();
      await approval.save({ transaction });

      const quotation = approval.Quotation;
      quotation.status = 'accepted';
      await quotation.save({ transaction });

      await db.ActivityLog.create({
        entity_type: 'approval',
        entity_id: approval.id,
        action: 'approved',
        description: `Quotation ${quotation.quotation_number} approved`,
        user_id: userId
      }, { transaction });

      await transaction.commit();
      return { message: 'Quotation approved successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async rejectQuotation(id, remarks, userId) {
    if (!remarks) {
      throw new AppError('Remarks are required for rejection', STATUS_CODES.BAD_REQUEST);
    }

    const transaction = await db.sequelize.transaction();
    try {
      const approval = await db.Approval.findByPk(id, { include: [db.Quotation], transaction });
      if (!approval) {
        throw new AppError('Approval not found', STATUS_CODES.NOT_FOUND);
      }

      if (approval.status !== 'pending') {
        throw new AppError(`Approval is already ${approval.status}`, STATUS_CODES.BAD_REQUEST);
      }

      approval.status = 'rejected';
      approval.remarks = remarks;
      approval.acted_at = new Date();
      await approval.save({ transaction });

      const quotation = approval.Quotation;
      quotation.status = 'rejected';
      await quotation.save({ transaction });

      await db.ActivityLog.create({
        entity_type: 'approval',
        entity_id: approval.id,
        action: 'rejected',
        description: `Quotation ${quotation.quotation_number} rejected`,
        user_id: userId
      }, { transaction });

      await transaction.commit();
      return { message: 'Quotation rejected successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

export default approvalService;
