import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "@/utils/constants";

/**
 * Central Axios instance
 *
 * Features:
 * - Automatic base URL from env
 * - Sends cookies (withCredentials) for cookie-based JWT auth (matches your backend)
 * - Request interceptor: attaches any extra headers if needed
 * - Response interceptor: on 401, attempts silent token refresh, then retries
 * - On refresh failure: clears auth and redirects to /login
 */

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required for cookie-based auth (access_token cookie)
    timeout: 10000,        // 10s request timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// ── Request Interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        // You can attach additional headers here if needed
        // e.g., config.headers["X-Request-ID"] = generateRequestId();
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = []; // Queue of requests waiting for token refresh

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRequest = originalRequest?.url && (
            originalRequest.url.includes(ENDPOINTS.LOGIN) ||
            originalRequest.url.includes(ENDPOINTS.REGISTER) ||
            originalRequest.url.includes(ENDPOINTS.REFRESH_TOKEN) ||
            originalRequest.url.includes(ENDPOINTS.LOGOUT)
        );

        // Only handle 401 Unauthorized — and only retry once (_retry flag)
        if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
            // If a refresh is already in progress, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => axiosInstance(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            if (originalRequest) {
                originalRequest._retry = true;
            }
            isRefreshing = true;

            try {
                // Attempt silent refresh — your backend sets a new access_token cookie
                await axiosInstance.post(ENDPOINTS.REFRESH_TOKEN);
                processQueue(null);
                return axiosInstance(originalRequest); // Retry the original request
            } catch (refreshError) {
                processQueue(refreshError);
                // Refresh failed — clear auth state and redirect to login
                // Import lazily to avoid circular dependency with authStore
                const { useAuthStore } = await import("@/store/authStore");
                useAuthStore.getState().logout();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
