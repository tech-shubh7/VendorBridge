import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import AppError from '../utils/appError.js';
import { errorResponse } from '../utils/response.js';

const isDevelopment = process.env.NODE_ENV === 'development';


const normalizeError = (err) => {
    // If it's already an operational error (like AppError or manually marked)
    if (err.isOperational || err instanceof AppError) {
        return {
            statusCode: err.statusCode || STATUS_CODES.BAD_REQUEST,
            status: err.status || 'fail',
            message: err.message,
            isOperational: true
        };
    }

    // Handle Joi validation errors specifically if they aren't wrapped in AppError
    if (err.isJoi || err.name === 'ValidationError') {
        return {
            statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
            status: 'fail',
            message: err.message || 'Validation failed.',
            isOperational: true
        };
    }

    // Default for unhandled or internal errors
    return {
        statusCode: err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR,
        status: err.status || 'error',
        message: isDevelopment ? err.message : 'Something went wrong!',
        isOperational: false
    };
};

/**
 * Central Error Handler Middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Next function
 */
const errorHandler = (err, req, res, next) => {
    const normalizedError = normalizeError(err);

    logger.error({
        message: normalizedError.message,
        statusCode: normalizedError.statusCode,
        status: normalizedError.status,
        method: req.method,
        url: req.originalUrl,
    });

    if (err.stack && isDevelopment) {
        logger.error(err.stack);
    }

    return errorResponse({
        res,
        statusCode: normalizedError.statusCode,
        message: normalizedError.message,
        errors: normalizedError.isOperational ? err.errors : null
    });
};

export default errorHandler;
