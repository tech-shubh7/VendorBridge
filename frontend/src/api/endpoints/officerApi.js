import axiosInstance from "@/api/axiosInstance";

/**
 * Procurement Officers API calls (routed through Admin Users CRUD)
 */
export const officerApi = {
    /** Get all officers (users with role=procurement_officer) with optional filters */
    getAll: (params = {}) =>
        axiosInstance.get("/admins/users", {
            params: { ...params, role: "procurement_officer" },
        }),

    /** Get a single officer by user ID */
    getById: (id) => axiosInstance.get(`/admins/users/${id}`),

    /** Create a new procurement officer account */
    create: (data) =>
        axiosInstance.post("/admins/users", {
            ...data,
            role: "procurement_officer",
        }),

    /** Update an existing procurement officer */
    update: (id, data) => axiosInstance.patch(`/admins/users/${id}`, data),

    /** Delete a procurement officer account */
    delete: (id) => axiosInstance.delete(`/admins/users/${id}`),

    /** Block / suspend a procurement officer account */
    block: (userId) =>
        axiosInstance.patch(`/admins/users/${userId}/account/blocked`),

    /** Unblock / activate a procurement officer account */
    unblock: (userId) =>
        axiosInstance.patch(`/admins/users/${userId}/account/unblocked`),
};
