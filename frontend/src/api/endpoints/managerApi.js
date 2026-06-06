import axiosInstance from "@/api/axiosInstance";

/**
 * Managers API calls (routed through Admin Users CRUD)
 */
export const managerApi = {
    /** Get all managers (users with role=manager) with optional filters */
    getAll: (params = {}) =>
        axiosInstance.get("/admins/users", {
            params: { ...params, role: "manager" },
        }),

    /** Get a single manager by user ID */
    getById: (id) => axiosInstance.get(`/admins/users/${id}`),

    /** Create a new manager account */
    create: (data) =>
        axiosInstance.post("/admins/users", { ...data, role: "manager" }),

    /** Update an existing manager */
    update: (id, data) => axiosInstance.patch(`/admins/users/${id}`, data),

    /** Delete a manager account */
    delete: (id) => axiosInstance.delete(`/admins/users/${id}`),

    /** Block / suspend a manager account */
    block: (userId) =>
        axiosInstance.patch(`/admins/users/${userId}/account/blocked`),

    /** Unblock / activate a manager account */
    unblock: (userId) =>
        axiosInstance.patch(`/admins/users/${userId}/account/unblocked`),
};
