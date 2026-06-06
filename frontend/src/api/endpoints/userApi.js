import axiosInstance from "@/api/axiosInstance";
import { ENDPOINTS } from "@/utils/constants";

/**
 * Users API calls
 */
export const userApi = {
    /** Get a user's profile by their ID */
    getById: (id) => axiosInstance.get(ENDPOINTS.USER_BY_ID(id)),

    /** Follow a user */
    follow: (id) => axiosInstance.post(ENDPOINTS.USER_FOLLOW(id)),

    /** Unfollow a user */
    unfollow: (id) => axiosInstance.delete(ENDPOINTS.USER_FOLLOW(id)),

    /** Update current user's profile */
    updateProfile: (data) =>
        axiosInstance.patch(ENDPOINTS.USERS, data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
};
