import axiosInstance from "@/api/axiosInstance";

/**
 * Invoices API calls — maps to /api/v1/invoices backend routes
 */
export const invoiceApi = {
    /** List all invoices with optional status filter */
    getAll: (params = {}) => axiosInstance.get("/invoices", { params }),

    /** Get invoice detail with line items */
    getById: (id) => axiosInstance.get(`/invoices/${id}`),

    /**
     * Generate an invoice from a sent PO
     * Body: { purchase_order_id, issue_date, due_date, notes }
     */
    create: (data) => axiosInstance.post("/invoices", data),

    /**
     * Update invoice status
     * Body: { status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' }
     */
    updateStatus: (id, status) =>
        axiosInstance.patch(`/invoices/${id}/status`, { status }),

    /** Download PDF as blob */
    downloadPdf: (id) =>
        axiosInstance.get(`/invoices/${id}/pdf`, { responseType: "blob" }),

    /**
     * Send invoice via email
     * Body: { to, cc, message }
     */
    sendEmail: (id, data) =>
        axiosInstance.post(`/invoices/${id}/send-email`, data),
};
