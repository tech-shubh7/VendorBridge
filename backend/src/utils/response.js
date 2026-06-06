/**
 * Utility to send a standardized success response
 * @param {Object} options - Response options
 * @param {import('express').Response} options.res - Express response object
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} [options.message='Success'] - Success message
 * @param {any} [options.data=null] - Data to send in the response
 */
export const successResponse = ({ res, statusCode = 200, message = 'Success', data = null }) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

/**
 * Utility to send a standardized error response
 * @param {Object} options - Response options
 * @param {import('express').Response} options.res - Express response object
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} [options.message='Error'] - Error message
 * @param {any} [options.errors=null] - Detailed error info
 */
export const errorResponse = ({ res, statusCode = 500, message = 'Error', errors = null }) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        errors
    });
};
