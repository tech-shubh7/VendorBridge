/**
 * Application-wide constants
 * Never hardcode these values directly in components
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || "Vendor Bridge";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.233:3000/api/v1";

/** Routes — use these instead of raw strings in <Link to=... /> */
export const ROUTES = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    RFQS: "/rfqs",
    RFQ_NEW: "/rfqs/new",
    CONTRACTS: "/contracts",
    INVENTORY: "/inventory",
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password/:token",
    PROFILE: "/profile/:username",
    SETTINGS: "/settings",
    MANAGERS: "/managers",
    OFFICERS: "/officers",
    QUOTATIONS: "/quotations",
    APPROVALS: "/approvals",
    NOT_FOUND: "*",
};

/** API endpoint paths — relative to API_BASE_URL */
export const ENDPOINTS = {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forget-password",
    RESET_PASSWORD: (token) => `/auth/reset-password/${token}`,

    // Dashboard
    DASHBOARD: "/dashboard",

    // Users
    USERS: "/users",
    USER_BY_ID: (id) => `/users/${id}`,
    USER_FOLLOW: (id) => `/users/${id}/follow`,

    // RFQs
    RFQS: "/rfqs",
    RFQ_BY_ID: (id) => `/rfqs/${id}`,
    RFQ_PUBLISH: (id) => `/rfqs/${id}/publish`,
    RFQ_CLOSE: (id) => `/rfqs/${id}/close`,
    RFQ_QUOTATIONS: (rfqId) => `/rfqs/${rfqId}/quotations`,
};

/** Query Keys for TanStack Query — avoids magic strings */
export const QUERY_KEYS = {
    ME: ["me"],
    POSTS: ["posts"],
    POST: (id) => ["posts", id],
    USER: (id) => ["users", id],
    USER_POSTS: (id) => ["users", id, "posts"],
    VENDORS: ["vendors"],
    MANAGERS: ["managers"],
    OFFICERS: ["officers"],
    DASHBOARD: ["dashboard"],
    RFQS: ["rfqs"],
    RFQ: (id) => ["rfqs", id],
};

/** Local storage keys */
export const STORAGE_KEYS = {
    AUTH: "auth-storage",
    THEME: "theme",
};
