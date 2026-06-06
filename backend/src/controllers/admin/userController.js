import STATUS_CODES from "../../config/constants.js";
import logger from "../../config/logger.js";
import userService from "../../services/admin/userService.js";
import { successResponse } from "../../utils/response.js";

export const index = async (req, res, next) => {
    try {
        const result = await userService.listUsers(req.query);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "Users fetched successfully.",
            data: result,
        });
    } catch (error) {
        logger.error(`admin list users error: ${error.message}`);
        next(error);
    }
};

export const store = async (req, res, next) => {
    try {
        const result = await userService.createUser(req.body);

        return successResponse({
            res,
            statusCode: STATUS_CODES.CREATED,
            message: "User created successfully.",
            data: result,
        });
    } catch (error) {
        logger.error(`admin create user error: ${error.message}`);
        next(error);
    }
};

export const show = async (req, res, next) => {
    try {
        const result = await userService.getUserById(req.params.id);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "User fetched successfully.",
            data: result,
        });
    } catch (error) {
        logger.error(`admin get user error: ${error.message}`);
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await userService.updateUser(req.params.id, req.body);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: "User updated successfully.",
            data: result,
        });
    } catch (error) {
        logger.error(`admin update user error: ${error.message}`);
        next(error);
    }
};

export const destroy = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message: result.message,
        });
    } catch (error) {
        logger.error(`admin delete user error: ${error.message}`);
        next(error);
    }
};

export const manageApprovalStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const approvalStatus = req.params.approvalStatus;

        const response = await userService.manageApprovalStatus(userId, approvalStatus);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message:
                approvalStatus === "approved"
                    ? "User account approved successfully."
                    : "User account rejected successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin manage user approval error: ${error.message}`);
        next(error);
    }
};

export const manageAccountStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const accountStatus = req.params.accountStatus;

        const response = await userService.manageAccountStatus(userId, accountStatus);

        return successResponse({
            res,
            statusCode: STATUS_CODES.SUCCESS,
            message:
                accountStatus === "blocked"
                    ? "User blocked successfully."
                    : "User unblocked successfully.",
            data: response,
        });
    } catch (error) {
        logger.error(`admin manage account status error: ${error.message}`);
        next(error);
    }
};
