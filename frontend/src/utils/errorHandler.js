/**
 * Normalize API errors into a consistent shape.
 * Your backend always returns: { status, message, errors }
 */

/**
 * Extracts a user-friendly message from an Axios error
 * @param {import("axios").AxiosError} error
 * @returns {{ message: string, errors: object | null }}
 */
export const parseApiError = (error) => {
    // Network error (no response from server)
    if (!error.response) {
        return {
            message: "Unable to reach the server. Check your internet connection.",
            errors: null,
        };
    }

    const { data, status } = error.response;

    // Backend returned a structured error (matches your backend shape)
    if (data && data.message) {
        return {
            message: data.message,
            errors: data.errors || null, // field-level errors from Joi
        };
    }

    // Fallback based on HTTP status
    const statusMessages = {
        400: "Bad request. Please check your input.",
        401: "You are not authorized. Please log in.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        409: "A conflict occurred. This resource may already exist.",
        422: "Validation failed. Please check your input.",
        429: "Too many requests. Please slow down.",
        500: "Something went wrong on our end. Please try again later.",
        503: "Service unavailable. Please try again shortly.",
    };

    return {
        message: statusMessages[status] || "An unexpected error occurred.",
        errors: null,
    };
};

/**
 * Gets the first field-level error for a given field
 * @param {object | null} errors - field errors object from API
 * @param {string} field - field name
 * @returns {string | null}
 */
export const getFieldError = (errors, field) => {
    if (!errors || typeof errors !== "object") return null;
    return errors[field] || null;
};
