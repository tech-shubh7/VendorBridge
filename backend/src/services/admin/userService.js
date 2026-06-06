import STATUS_CODES from "../../config/constants.js";
import db from "../../models/index.js";
import AppError from "../../utils/appError.js";


const userService = {
    /**
     * Approve or reject a user account and send a notification email.
     */
    async manageApprovalStatus(id, status) {
        const user = await db.User.findByPk(id);

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        if (user.status !== "pending") {
            throw new AppError("approval action already taken for this account", STATUS_CODES.BAD_REQUEST);
        }

        if (!["approved", "rejected"].includes(status)) {
            throw new AppError("Approval status must be 'approved' or 'rejected'.", STATUS_CODES.BAD_REQUEST);
        }

        if (status === "approved") {
            await user.update({ status: "active" });

        } else {
            await user.update({ status: "rejected" });
        }

        return user.toJSON();
    },

    /**
     * Block or unblock a user account and send a notification email.
     */
    async manageAccountStatus(userId, status) {
        const user = await db.User.findByPk(userId);

        if (!user) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        if (status === "unblocked" && user.is_active === true) {
            throw new AppError("user is already unblocked", STATUS_CODES.BAD_REQUEST);
        }
        if (status === "blocked" && user.is_active === false) {
            throw new AppError("user is already blocked", STATUS_CODES.BAD_REQUEST);
        }

        if (!["blocked", "unblocked"].includes(status)) {
            throw new AppError("Account status must be 'blocked' or 'unblocked'.", STATUS_CODES.BAD_REQUEST);
        }

        if (status === "blocked") {
            await user.update({ is_active: false });
        } else {
            await user.update({ is_active: true });
        }

        return user.toJSON();
    },

};

export default userService;