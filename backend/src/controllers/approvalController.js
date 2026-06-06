import db from '../models/index.js';

/**
 * Initiates an approval for a quotation
 */
export const initiateApproval = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { quotation_id, approver_id } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!quotation_id || !approver_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'quotation_id and approver_id are required' });
    }

    const quotation = await db.Quotation.findByPk(quotation_id, { transaction });
    if (!quotation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status !== 'submitted') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Only submitted quotations can be sent for approval' });
    }

    const existingApproval = await db.Approval.findOne({ where: { quotation_id }, transaction });
    if (existingApproval) {
      await transaction.rollback();
      return res.status(409).json({ message: 'An approval already exists for this quotation' });
    }

    const approval = await db.Approval.create({
      quotation_id,
      initiated_by: userId,
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

    return res.status(201).json({
      message: 'Approval initiated successfully',
      data: {
        id: approval.id,
        status: approval.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error initiating approval:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * List approvals
 */
export const getApprovals = async (req, res) => {
  try {
    const approvals = await db.Approval.findAll({
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

    return res.status(200).json({ data: approvals });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get approval detail
 */
export const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ message: 'Approval not found' });
    }

    return res.status(200).json({
      approval: {
        id: approval.id,
        status: approval.status,
        initiated_at: approval.created_at,
        initiated_by: approval.initiated_by
      },
      quotation: {
        quotation_number: approval.Quotation.quotation_number,
        total_amount: approval.Quotation.total_amount,
        delivery_days: approval.Quotation.delivery_days,
        items: approval.Quotation.QuotationItems
      },
      vendor: approval.Quotation.Vendor
    });
  } catch (error) {
    console.error('Error fetching approval detail:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Manager approves the quotation
 */
export const approveQuotation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const approval = await db.Approval.findByPk(id, { include: [db.Quotation], transaction });
    if (!approval) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ message: `Approval is already ${approval.status}` });
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
    return res.status(200).json({ message: 'Quotation approved successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error approving quotation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Manager rejects the quotation
 */
export const rejectQuotation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!remarks) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Remarks are required for rejection' });
    }

    const approval = await db.Approval.findByPk(id, { include: [db.Quotation], transaction });
    if (!approval) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ message: `Approval is already ${approval.status}` });
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
    return res.status(200).json({ message: 'Quotation rejected successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting quotation:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
