import axiosInstance from "@/api/axiosInstance";

/**
 * Purchase Orders API calls — maps to /api/v1/purchase-orders backend routes
 */
export const poApi = {
    /** List all Purchase Orders */
    getAll: () => axiosInstance.get("/purchase-orders"),

    /** Get a single Purchase Order with items */
    getById: (id) => axiosInstance.get(`/purchase-orders/${id}`),

    /**
     * Generate a PO from an approved quotation
     * Body: { quotation_id, delivery_date, payment_terms, terms_and_conditions, billing_address, shipping_address }
     */
    create: (data) => axiosInstance.post("/purchase-orders", data),

    /**
     * Update a draft PO
     * Body: { delivery_date, payment_terms, terms_and_conditions, billing_address, shipping_address }
     */
    update: (id, data) => axiosInstance.put(`/purchase-orders/${id}`, data),

    /** Send a draft PO to the vendor */
    send: (id) => axiosInstance.patch(`/purchase-orders/${id}/send`),
};
