import axiosInstance from "@/api/axiosInstance";

/**
 * RFQ API calls — maps directly to /api/v1/rfqs backend routes
 */
export const rfqApi = {
    /**
     * List RFQs with optional filters
     * GET /rfqs?page=1&limit=20&status=&search=
     */
    getAll: (params = {}) =>
        axiosInstance.get("/rfqs", { params }),

    /**
     * Create a new RFQ (saved as draft)
     * POST /rfqs
     * Body: { title, description, deadline, items: [{ item_name, quantity, unit, specifications }], vendor_ids: [uuid] }
     */
    create: (data) => axiosInstance.post("/rfqs", data),

    /**
     * Get detail of a specific RFQ
     * GET /rfqs/:id
     */
    getById: (id) => axiosInstance.get(`/rfqs/${id}`),

    /**
     * Publish a draft RFQ
     * PATCH /rfqs/:id/publish
     */
    publish: (id) => axiosInstance.patch(`/rfqs/${id}/publish`),

    /**
     * Close an open RFQ
     * PATCH /rfqs/:id/close
     */
    close: (id) => axiosInstance.patch(`/rfqs/${id}/close`),

    /**
     * Get all quotations for an RFQ
     * GET /rfqs/:rfqId/quotations
     */
    getQuotations: (rfqId) => axiosInstance.get(`/rfqs/${rfqId}/quotations`),

    /**
     * Compare quotations for an RFQ
     * GET /rfqs/:rfqId/quotations/compare
     */
    compareQuotations: (rfqId) => axiosInstance.get(`/rfqs/${rfqId}/quotations/compare`),
};
