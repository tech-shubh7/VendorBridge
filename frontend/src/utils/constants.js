/**
 * Application-wide constants
 * Never hardcode these values directly in components
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || "SocialApp";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

/** Routes — use these instead of raw strings in <Link to=... /> */
export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    PROFILE: "/profile/:username",
    SETTINGS: "/settings",
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

    // Users
    USERS: "/users",
    USER_BY_ID: (id) => `/users/${id}`,
    USER_FOLLOW: (id) => `/users/${id}/follow`,

    // Posts
    POSTS: "/posts",
    POST_BY_ID: (id) => `/posts/${id}`,
    POST_LIKE: (id) => `/posts/${id}/like`,
    POST_COMMENT: (id) => `/posts/${id}/comments`,
};

/** Query Keys for TanStack Query — avoids magic strings */
export const QUERY_KEYS = {
    ME: ["me"],
    POSTS: ["posts"],
    POST: (id) => ["posts", id],
    USER: (id) => ["users", id],
    USER_POSTS: (id) => ["users", id, "posts"],
};

/** Local storage keys */
export const STORAGE_KEYS = {
    AUTH: "auth-storage",
    THEME: "theme",
};
