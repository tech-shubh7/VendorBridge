import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import useMe from "@/features/auth/hooks/useMe";
import { ROUTES } from "@/utils/constants";

/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * If the user is not logged in, redirects to /login.
 *
 * Usage in AppRouter:
 *   <Route element={<ProtectedRoute />}>
 *       <Route path="/" element={<HomePage />} />
 *   </Route>
 */
const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Fetch and sync user data silently in the background
    useMe();

    if (!isAuthenticated) {
        // Replace: true means /login doesn't get added to browser history
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Outlet renders the matched child route
    return <Outlet />;
};

export default ProtectedRoute;
