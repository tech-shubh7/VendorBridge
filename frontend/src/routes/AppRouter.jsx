import { Routes, Route } from "react-router-dom";
import CreateRFQPage from "@/pages/CreateRFQPage";
import DashboardPage from "@/pages/DashboardPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";
import RFQManagementPage from "@/pages/RFQManagementPage";
import RegisterPage from "@/pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ManagerManagementPage from "@/pages/ManagerManagementPage";
import ProcurementOfficerManagementPage from "@/pages/ProcurementOfficerManagementPage";
import QuotationsPage from "@/pages/QuotationsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { ROUTES } from "@/utils/constants";

const AppRouter = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.RFQS} element={<RFQManagementPage />} />
                <Route path={ROUTES.RFQ_NEW} element={<CreateRFQPage />} />
                <Route path={ROUTES.MANAGERS} element={<ManagerManagementPage />} />
                <Route path={ROUTES.OFFICERS} element={<ProcurementOfficerManagementPage />} />
                <Route path={ROUTES.QUOTATIONS} element={<QuotationsPage />} />
                <Route path={ROUTES.APPROVALS} element={<ApprovalsPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;
