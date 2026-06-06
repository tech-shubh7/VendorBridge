import STATUS_CODES from "../config/constants.js";
import logger from "../config/logger.js";
import authService from "../services/authService.js";
import { successResponse } from "../utils/response.js";

export const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);

        return successResponse({
            res,
            statusCode: STATUS_CODES.CREATED,
            message: result.message,
            data: result.account,
        });
    } catch (error) {
        logger.error(`register error: ${error.message}`);
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        res.cookie("token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Logged in successfully.",
            data: result.user,
        });
    } catch (error) {
        logger.error(`login error: ${error.message}`);
        next(error);
    }
};