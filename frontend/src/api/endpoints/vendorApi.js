import axiosInstance from "@/api/axiosInstance";

/**
 * Vendors API calls (routed through Admin Users CRUD)
 */
export const vendorApi = {
    /** Get all vendors (users with role=vendor) with optional filters */
    getAll: (params = {}) => axiosInstance.get("/vendors", { params }),

    /** Get details of a single vendor/user */
    getById: (id) => axiosInstance.get(`/admins/users/${id}`),

    /** Create a new vendor user (automatically creates both User and Vendor profile records) */
    create: (data) => axiosInstance.post("/admins/users", { ...data, role: "vendor" }),

    /** Update vendor user/profile details */
    update: (id, data) => axiosInstance.patch(`/admins/users/${id}`, data),

    /** Delete a vendor user account (cascades to Vendor profile) */
    delete: (id) => axiosInstance.delete(`/admins/users/${id}`),

    /** Approve a vendor's user account */
    approve: (userId) => axiosInstance.patch(`/admins/users/${userId}/approval/approved`),

    /** Reject a vendor's user account application */
    reject: (userId) => axiosInstance.patch(`/admins/users/${userId}/approval/rejected`),

    /** Block/suspend a vendor's user account */
    block: (userId) => axiosInstance.patch(`/admins/users/${userId}/account/blocked`),

    /** Unblock/activate a vendor's user account */
    unblock: (userId) => axiosInstance.patch(`/admins/users/${userId}/account/unblocked`),
};
