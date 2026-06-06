import STATUS_CODES from "../config/constants";
import logger from "../config/logger";
import authService from "../services/authService";
import { successResponse } from "../utils/response";

export const login = async (req, res, next) => {
    try {

        const res = await authService.login(req.body);

        res.cookie("jwt", res.token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 4 * 60 * 60 * 1000
        });

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "logged in successfully",
            data: res.user
        });

    } catch (error) {
        logger.error(`login error: ${error.message}`);
        next(error);
    }
}