import axiosInstance from "@/api/axiosInstance";

/**
 * Quotations API calls — maps to /api/v1/quotations backend routes
 */
export const quotationApi = {
    /**
     * Get all quotations
     * GET /quotations
     */
    getAll: () => axiosInstance.get("/quotations"),

    /**
     * Get quotation detail
     * GET /quotations/:id
     */
    getById: (id) => axiosInstance.get(`/quotations/${id}`),

    /**
     * Create or save draft quotation
     * POST /quotations
     * Body: { rfq_id, vendor_id, delivery_days, payment_terms, valid_until, notes, items: [...] }
     */
    create: (data) => axiosInstance.post("/quotations", data),

    /**
     * Update draft quotation
     * PUT /quotations/:id
     * Body: { delivery_days, payment_terms, valid_until, notes, items: [...] }
     */
    update: (id, data) => axiosInstance.put(`/quotations/${id}`, data),

    /**
     * Submit draft quotation
     * PATCH /quotations/:id/submit
     */
    submit: (id) => axiosInstance.patch(`/quotations/${id}/submit`),

    /**
     * Get RFQs vendor was invited to
     * GET /quotations/my-rfqs?vendor_id=...
     */
    getMyRfqs: (vendorId) =>
        axiosInstance.get("/quotations/my-rfqs", {
            params: { vendor_id: vendorId },
        }),
};
