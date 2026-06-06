import axiosInstance from "@/api/axiosInstance";
import { ENDPOINTS } from "@/utils/constants";

/**
 * Dashboard API
 *
 * The backend resolves the role automatically from the session cookie
 * and returns a role-specific payload:
 *   - admin              → stats, breakdowns, recent (users/rfqs/pos)
 *   - procurement_officer → stats, breakdowns, recent (rfqs/pos/invoices)
 *   - manager            → stats, breakdowns, recent (approval_queue/recently_acted)
 *   - vendor             → stats, vendor_profile, breakdowns, recent (rfqs/quotations/pos)
 */
export const dashboardApi = {
    /** Fetch the role-aware dashboard data for the current user */
    get: () => axiosInstance.get(ENDPOINTS.DASHBOARD),
};
