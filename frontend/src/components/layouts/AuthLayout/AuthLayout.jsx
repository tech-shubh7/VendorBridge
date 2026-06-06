import { Outlet } from "react-router-dom";
import { APP_NAME } from "@/utils/constants";

/**
 * AuthLayout
 *
 * Centered card layout used for Login and Register pages.
 * No sidebar or navbar.
 */
const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-600">{APP_NAME}</h1>
                    <p className="text-sm text-gray-500 mt-1">Connect, share, and explore</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    {/* Outlet renders LoginPage or RegisterPage */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
