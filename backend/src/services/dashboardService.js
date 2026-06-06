import db from "../models/index.js";

const { Op, fn, col, literal } = db.Sequelize;

const RECENT_LIMIT = 5;

const startOfCurrentMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

const dashboardService = {

    async getAdminDashboard() {
        const [
            totalUsers,
            totalVendors,
            activeRfqs,
            pendingApprovals,
            procurementSpend,
            recentUsers,
            recentRfqs,
            recentPOs,
            usersByRole,
            rfqsByStatus,
        ] = await Promise.all([
            db.User.count(),
            db.Vendor.count(),
            db.Rfq.count({ where: { status: { [Op.in]: ['open', 'under_review'] } } }),
            db.Approval.count({ where: { status: 'pending' } }),
            db.PurchaseOrder.sum('total_amount', {
                where: { status: { [Op.in]: ['sent', 'acknowledged', 'fulfilled'] } },
            }),
            db.User.findAll({
                attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Rfq.findAll({
                attributes: ['id', 'rfq_number', 'title', 'status', 'deadline', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.PurchaseOrder.findAll({
                attributes: ['id', 'po_number', 'status', 'total_amount', 'currency', 'created_at'],
                include: [{ model: db.Vendor, attributes: ['company_name'] }],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.User.findAll({
                attributes: ['role', [fn('COUNT', col('id')), 'count']],
                group: ['role'],
                raw: true,
            }),
            db.Rfq.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
        ]);

        return {
            stats: {
                total_users: totalUsers,
                total_vendors: totalVendors,
                active_rfqs: activeRfqs,
                pending_approvals: pendingApprovals,
                total_procurement_spend: Number(procurementSpend || 0),
            },
            breakdowns: {
                users_by_role: usersByRole,
                rfqs_by_status: rfqsByStatus,
            },
            recent: {
                users: recentUsers,
                rfqs: recentRfqs,
                purchase_orders: recentPOs,
            },
        };
    },

    async getProcurementOfficerDashboard(userId) {
        const monthStart = startOfCurrentMonth();

        const [
            myActiveRfqs,
            totalActiveRfqs,
            pendingQuotations,
            pendingApprovals,
            monthlySpend,
            recentRfqs,
            recentPOs,
            recentInvoices,
            rfqsByStatus,
        ] = await Promise.all([
            db.Rfq.count({
                where: { user_id: userId, status: { [Op.in]: ['open', 'under_review'] } },
            }),
            db.Rfq.count({ where: { status: { [Op.in]: ['open', 'under_review'] } } }),
            db.Quotation.count({ where: { status: 'submitted' } }),
            db.Approval.count({ where: { status: 'pending' } }),
            db.PurchaseOrder.sum('total_amount', {
                where: {
                    user_id: userId,
                    status: { [Op.in]: ['sent', 'acknowledged', 'fulfilled'] },
                    created_at: { [Op.gte]: monthStart },
                },
            }),
            db.Rfq.findAll({
                where: { user_id: userId },
                attributes: ['id', 'rfq_number', 'title', 'status', 'deadline', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.PurchaseOrder.findAll({
                where: { user_id: userId },
                attributes: ['id', 'po_number', 'status', 'total_amount', 'currency', 'created_at'],
                include: [{ model: db.Vendor, attributes: ['company_name'] }],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Invoice.findAll({
                where: { user_id: userId },
                attributes: ['id', 'invoice_number', 'status', 'total_amount', 'issue_date', 'due_date'],
                include: [{ model: db.Vendor, attributes: ['company_name'] }],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Rfq.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
        ]);

        return {
            stats: {
                my_active_rfqs: myActiveRfqs,
                total_active_rfqs: totalActiveRfqs,
                pending_quotations: pendingQuotations,
                pending_approvals: pendingApprovals,
                monthly_spend: Number(monthlySpend || 0),
            },
            breakdowns: {
                rfqs_by_status: rfqsByStatus,
            },
            recent: {
                rfqs: recentRfqs,
                purchase_orders: recentPOs,
                invoices: recentInvoices,
            },
        };
    },

    async getVendorDashboard(userId) {
        const vendor = await db.Vendor.findOne({ where: { user_id: userId } });

        if (!vendor) {
            return {
                stats: { assigned_rfqs: 0, submitted_quotations: 0, accepted_quotations: 0, purchase_orders: 0 },
                recent: { rfqs: [], quotations: [], purchase_orders: [] },
            };
        }

        const vendorId = vendor.id;

        const [
            assignedRfqs,
            submittedQuotations,
            acceptedQuotations,
            totalPOs,
            recentRfqs,
            recentQuotations,
            recentPOs,
            quotationsByStatus,
        ] = await Promise.all([
            db.RfqVendor.count({ where: { vendor_id: vendorId } }),
            db.Quotation.count({ where: { vendor_id: vendorId, status: { [Op.in]: ['submitted', 'under_review'] } } }),
            db.Quotation.count({ where: { vendor_id: vendorId, status: 'accepted' } }),
            db.PurchaseOrder.count({ where: { vendor_id: vendorId } }),
            db.RfqVendor.findAll({
                where: { vendor_id: vendorId },
                include: [{
                    model: db.Rfq,
                    attributes: ['id', 'rfq_number', 'title', 'status', 'deadline'],
                }],
                order: [['invited_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Quotation.findAll({
                where: { vendor_id: vendorId },
                attributes: ['id', 'quotation_number', 'status', 'total_amount', 'currency', 'submitted_at'],
                include: [{ model: db.Rfq, attributes: ['rfq_number', 'title'] }],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.PurchaseOrder.findAll({
                where: { vendor_id: vendorId },
                attributes: ['id', 'po_number', 'status', 'total_amount', 'currency', 'delivery_date', 'created_at'],
                order: [['created_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Quotation.findAll({
                where: { vendor_id: vendorId },
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
        ]);

        return {
            stats: {
                assigned_rfqs: assignedRfqs,
                submitted_quotations: submittedQuotations,
                accepted_quotations: acceptedQuotations,
                purchase_orders: totalPOs,
            },
            vendor_profile: {
                company_name: vendor.company_name,
                category: vendor.category,
                rating: vendor.rating,
            },
            breakdowns: {
                quotations_by_status: quotationsByStatus,
            },
            recent: {
                rfqs: recentRfqs.map(rv => rv.Rfq),
                quotations: recentQuotations,
                purchase_orders: recentPOs,
            },
        };
    },

    async getManagerDashboard(userId) {
        const [
            pendingApprovals,
            approvedCount,
            rejectedCount,
            totalApprovals,
            approvalQueue,
            recentlyActed,
            approvalsByStatus,
        ] = await Promise.all([
            db.Approval.count({ where: { approved_by: userId, status: 'pending' } }),
            db.Approval.count({ where: { approved_by: userId, status: 'approved' } }),
            db.Approval.count({ where: { approved_by: userId, status: 'rejected' } }),
            db.Approval.count({ where: { approved_by: userId } }),
            db.Approval.findAll({
                where: { approved_by: userId, status: 'pending' },
                attributes: ['id', 'status', 'initiated_at', 'remarks'],
                include: [{
                    model: db.Quotation,
                    attributes: ['quotation_number', 'total_amount', 'currency'],
                    include: [{
                        model: db.Rfq,
                        attributes: ['rfq_number', 'title'],
                    }],
                }],
                order: [['initiated_at', 'ASC']],
                limit: RECENT_LIMIT,
            }),
            db.Approval.findAll({
                where: {
                    approved_by: userId,
                    status: { [Op.in]: ['approved', 'rejected'] },
                },
                attributes: ['id', 'status', 'acted_at', 'remarks'],
                include: [{
                    model: db.Quotation,
                    attributes: ['quotation_number', 'total_amount', 'currency'],
                }],
                order: [['acted_at', 'DESC']],
                limit: RECENT_LIMIT,
            }),
            db.Approval.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
        ]);

        return {
            stats: {
                pending_approvals: pendingApprovals,
                approved_count: approvedCount,
                rejected_count: rejectedCount,
                total_handled: totalApprovals,
            },
            breakdowns: {
                approvals_by_status: approvalsByStatus,
            },
            recent: {
                approval_queue: approvalQueue,
                recently_acted: recentlyActed,
            },
        };
    },
};

export default dashboardService;
