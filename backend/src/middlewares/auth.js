import jwt from "jsonwebtoken";
import config from "../config/app.js";
import STATUS_CODES from "../config/constants.js";
import logger from "../config/logger.js";
import AppError from "../utils/appError.js";

export const authenticate = async (req, res, next) => {
    try {
        if (!config.access_token_secret) {
            throw new AppError("Access token secret not found", STATUS_CODES.INTERNAL_SERVER_ERROR);
        }

        const token = req.cookies.access_token;

        if (!token) {
            throw new AppError("access token not found", STATUS_CODES.UNAUTHORIZED);
        }

        const decoded = jwt.verify(token, config.access_token_secret);

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
}

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