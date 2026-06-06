import logger from "../config/logger.js";
import dashboardService from "../services/dashboardService.js";
import { successResponse } from "../utils/response.js";

export const getDashboard = async (req, res, next) => {
    try {
        const { role, user_id } = req.user;

        let data;

        switch (role) {
            case "admin":
                data = await dashboardService.getAdminDashboard();
                break;
            case "procurement_officer":
                data = await dashboardService.getProcurementOfficerDashboard(user_id);
                break;
            case "vendor":
                data = await dashboardService.getVendorDashboard(user_id);
                break;
            case "manager":
                data = await dashboardService.getManagerDashboard(user_id);
                break;
            default:
                data = {};
        }

        return successResponse({
            res,
            message: "Dashboard data fetched successfully.",
            data: { role, ...data },
        });
    } catch (error) {
        logger.error(`getDashboard error: ${error.message}`);
        next(error);
    }
};
