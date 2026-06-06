import STATUS_CODES from "../../config/constants.js";
import logger from "../../config/logger.js";
import userService from "../../services/admin/userService.js";
import { successResponse } from "../../utils/response.js";

/**
 * PATCH /admin/users/:id/approval/:approvalStatus
 * Approve or reject a user account.
 */
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

/**
 * PATCH /admin/users/:id/account/:accountStatus
 * Block or unblock a user account.
 */
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
