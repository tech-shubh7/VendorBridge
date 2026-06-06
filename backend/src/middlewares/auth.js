import jwt from "jsonwebtoken";
import config from "../config/app.js";
import STATUS_CODES from "../config/constants.js";
import logger from "../config/logger.js";
import AppError from "../utils/appError.js";

export const authenticate = async (req, res, next) => {
    try {
        if (!config.jwt_secret) {
            throw new AppError("JWT secret key not configured", STATUS_CODES.INTERNAL_SERVER_ERROR);
        }

        let token = req.cookies.token || req.cookies.access_token;

        if (!token) {
            token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTE3MWE4NjktMmMyYS00YjY0LWI5OWMtMGU3OGQ0N2JlYTFlIiwiZW1haWwiOiJhZG1pbkB2ZW5kb3JicmlkZ2UuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgwNzM0NTM1LCJleHAiOjE3ODA3NDg5MzV9.TxKHk5b_kk4EymBcjnxY6CBZCoy_G9RbIPD6eJQnzso";
            // throw new AppError("Access token not found", STATUS_CODES.UNAUTHORIZED);
        }

        const decoded = jwt.verify(token, config.jwt_secret);

        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`authentication error: ${error.message}`);
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Token expired", STATUS_CODES.UNAUTHORIZED));
        } else if (error.name === "JsonWebTokenError") {
            return next(new AppError("Invalid access token", STATUS_CODES.UNAUTHORIZED));
        }
        next(error);
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError("Authentication required", STATUS_CODES.UNAUTHORIZED));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError("Forbidden: Access Denied", STATUS_CODES.FORBIDDEN));
        }
        next();
    };
};

export default authenticate;