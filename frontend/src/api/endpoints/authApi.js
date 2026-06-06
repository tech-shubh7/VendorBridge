import axiosInstance from "@/api/axiosInstance";
import { ENDPOINTS } from "@/utils/constants";

/**
 * Auth API calls
 * All functions return the Axios response data directly
 */

export const authApi = {
    /**
     * Login — backend sets access_token cookie on success
     * @param {{ email: string, password: string }} credentials
     */
    login: (credentials) => axiosInstance.post(ENDPOINTS.LOGIN, credentials),

    /**
     * Register new user
     * @param {{ username: string, email: string, password: string }} data
     */
    register: (data) => axiosInstance.post(ENDPOINTS.REGISTER, data),

    /**
     * Logout — backend clears the cookie
     */
    logout: () => axiosInstance.post(ENDPOINTS.LOGOUT),

    /**
     * Refresh access token silently
     * Backend reads refresh_token cookie and issues a new access_token
     */
    refreshToken: () => axiosInstance.post(ENDPOINTS.REFRESH_TOKEN),

    /**
     * Get the currently logged-in user's profile
     */
    getMe: () => axiosInstance.get(ENDPOINTS.ME),

    /**
     * Send a forgot-password email.
     * @param {{ email: string }} data
     */
    forgotPassword: (data) => axiosInstance.post(ENDPOINTS.FORGOT_PASSWORD, data),

    /**
     * Reset password using token from email link.
     * @param {string} token  - URL token
     * @param {{ password: string, confirm_password: string }} data
     */
    resetPassword: (token, data) =>
        axiosInstance.patch(ENDPOINTS.RESET_PASSWORD(token), data),
};
