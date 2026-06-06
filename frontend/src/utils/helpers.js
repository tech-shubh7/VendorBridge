/**
 * General-purpose helper utilities
 */

/**
 * Format a date string to a readable format
 * @param {string | Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

/**
 * Format a date to a relative time (e.g. "3 hours ago")
 * @param {string | Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }
    return "just now";
};

/**
 * Truncate a string to a max length with ellipsis
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 100) => {
    if (!str) return "";
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength).trimEnd() + "...";
};

/**
 * Get user initials from a name (for Avatar fallback)
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Format a number to a compact representation (e.g. 1200 → "1.2K")
 * @param {number} num
 * @returns {string}
 */
export const formatCount = (num) => {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en", { notation: "compact" }).format(num);
};

/**
 * Delay execution (useful in async flows)
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build full name from user object
 * @param {{ first_name?: string, last_name?: string, username?: string }} user
 * @returns {string}
 */
export const getDisplayName = (user) => {
    if (!user) return "Unknown";
    if (user.first_name || user.last_name) {
        return [user.first_name, user.last_name].filter(Boolean).join(" ");
    }
    return user.username || "Unknown";
};
