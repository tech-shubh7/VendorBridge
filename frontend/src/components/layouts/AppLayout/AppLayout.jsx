import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/endpoints/authApi";
import { ROUTES } from "@/utils/constants";
import Avatar from "@/components/ui/Avatar/Avatar";
import toast from "react-hot-toast";

/**
 * AppLayout
 *
 * The main layout for authenticated pages.
 * Structure: Fixed top navbar + Left sidebar + Scrollable content area
 *
 * Extend this to add navigation links, notification bell, etc.
 */
const AppLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Proceed even if API call fails
        } finally {
            logout();
            navigate(ROUTES.LOGIN);
            toast.success("Logged out successfully");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── Top Navbar ─────────────────────────────────── */}
            <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
                <Link to={ROUTES.HOME} className="text-xl font-bold text-indigo-600">
                    SocialApp
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 hidden sm:block">
                        @{user?.username}
                    </span>
                    <Avatar
                        src={user?.avatar_url}
                        name={user?.username}
                        size="sm"
                    />
                    <button
                        onClick={handleLogout}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* ── Body: Sidebar + Content ────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white p-4 gap-1">
                    <NavItem to={ROUTES.HOME} icon="🏠" label="Home" />
                    <NavItem to={`/profile/${user?.username}`} icon="👤" label="Profile" />
                    {/* Add more nav items here */}
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto">
                        {/* Outlet renders the matched child route */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

/**
 * Sidebar nav item helper
 */
const NavItem = ({ to, icon, label }) => (
    <Link
        to={to}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium"
    >
        <span className="text-base">{icon}</span>
        {label}
    </Link>
);

export default AppLayout;
