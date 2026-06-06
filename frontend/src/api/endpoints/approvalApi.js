import axiosInstance from "@/api/axiosInstance";

/**
 * Approvals API calls
 */
export const approvalApi = {
    /** Get all approvals */
    getAll: () => axiosInstance.get("/approvals"),

    /** Get details of a single approval with quotation and vendor details */
    getById: (id) => axiosInstance.get(`/approvals/${id}`),

    /** Initiate approval for a quotation */
    initiate: (quotationId, approverId) =>
        axiosInstance.post("/approvals", {
            quotation_id: quotationId,
            approver_id: approverId,
        }),

    /** Approve quotation */
    approve: (id, remarks) =>
        axiosInstance.patch(`/approvals/${id}/approve`, { remarks }),

    /** Reject quotation */
    reject: (id, remarks) =>
        axiosInstance.patch(`/approvals/${id}/reject`, { remarks }),
};
