import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/utils/constants";
import toast from "react-hot-toast";
import "@/pages/VendorManagementPage.css";

const navItems = [
    { icon: "dashboard", label: "Dashboard", to: "/dashboard" },
    { icon: "factory", label: "Vendors", to: "/vendors" },
    { icon: "request_quote", label: "RFQs", to: "/rfqs" },
    { icon: "rate_review", label: "Quotations", to: "/quotations" },
    { icon: "fact_check", label: "Approvals", to: "/approvals" },
    { icon: "receipt_long", label: "Purchase Orders", to: "/purchase-orders" },
    { icon: "receipt", label: "Invoices", to: "/invoices" },
    { icon: "supervisor_account", label: "Managers", to: "/managers" },
    { icon: "assignment_ind", label: "Officers", to: "/officers" },
];

export const Icon = ({ children, filled = false, className = "" }) => (
    <span className={`material-symbols-outlined ${filled ? "vb-icon-filled" : ""} ${className}`}>
        {children}
    </span>
);

const SideNav = ({ active = "Vendors", isOpen = false, onClose }) => {
    const { logout, user } = useAuthStore();
    const role = user?.role || "admin";
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        toast.success("Logged out successfully");
        navigate(ROUTES.LOGIN);
    };

    // Filter sidebar links based on role
    const filteredNavItems = navItems.filter((item) => {
        if (role === "vendor") {
            return ["Dashboard", "Quotations"].includes(item.label);
        }
        if (role === "manager") {
            return ["Dashboard", "RFQs", "Quotations", "Approvals"].includes(item.label);
        }
        if (role === "officer" || role === "procurement_officer") {
            return ["Dashboard", "Vendors", "RFQs", "Quotations", "Approvals", "Purchase Orders", "Invoices"].includes(item.label);
        }
        if (role === "admin") {
            return ["Dashboard", "Vendors", "Quotations", "Approvals", "Purchase Orders", "Invoices", "Managers", "Officers"].includes(item.label);
        }
        return true;
    });

    return (
        <aside className={`vb-sidebar${isOpen ? " is-open" : ""}`}>
            <div className="vb-brand">
                <div className="vb-logo" aria-hidden="true">
                    <span />
                </div>
                <div>
                    <h1>VendorBridge</h1>
                    <p>Enterprise ERP</p>
                </div>
                <button
                    className="vb-sidebar-close vb-icon-button"
                    aria-label="Close menu"
                    onClick={onClose}
                >
                    <Icon>close</Icon>
                </button>
            </div>

            {role !== "vendor" && role !== "admin" && (
                <Link className="vb-primary-action" to="/rfqs/new">
                    <Icon>add</Icon>
                    Create New RFQ
                </Link>
            )}

            <nav className="vb-sidebar-nav" aria-label="Primary navigation">
                {filteredNavItems.map((item) => {
                    const isActive = item.label === active;

                    return (
                        <Link className={`vb-nav-link ${isActive ? "is-active" : ""}`} to={item.to} key={item.label}>
                            <Icon filled={isActive}>{item.icon}</Icon>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="vb-sidebar-footer">
                <a className="vb-nav-link" href="#" onClick={handleLogout}>
                    <Icon>logout</Icon>
                    Log Out
                </a>
            </div>
        </aside>
    );
};

const TopNav = ({ active = "Vendors", searchPlaceholder = "Search vendors, codes, or contacts...", onToggleSidebar }) => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const navigate = useNavigate();
    
    // Derive initials from name or username/email
    const initials = user?.name
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : (user?.username 
            ? user.username.replace("@", "").slice(0, 2).toUpperCase()
            : "JD");

    const usernameSlug = user?.username || (user?.email ? user.email.split("@")[0] : "") || "jane.doe";

    return (
        <header className="vb-topbar">
            <div className="vb-mobile-brand">
                <button className="vb-icon-button" aria-label="Open menu" onClick={onToggleSidebar}>
                    <Icon>menu</Icon>
                </button>
                <strong>VendorBridge</strong>
            </div>

            <label className="vb-search">
                <Icon>search</Icon>
                <input placeholder={searchPlaceholder} />
            </label>

            <div className="vb-topbar-actions">
                <nav className="vb-page-tabs" aria-label="Workspace navigation">
                    <Link className={active === "Dashboard" ? "is-active" : ""} to="/dashboard">Dashboard</Link>
                    {role === "vendor" && (
                        <Link className={active === "Quotations" ? "is-active" : ""} to="/quotations">Quotations</Link>
                    )}
                    {(role === "officer" || role === "procurement_officer") && (
                        <>
                            <Link className={active === "Vendors" ? "is-active" : ""} to="/vendors">Vendors</Link>
                            <Link className={active === "RFQs" ? "is-active" : ""} to="/rfqs">RFQs</Link>
                            <Link className={active === "Purchase Orders" ? "is-active" : ""} to="/purchase-orders">POs</Link>
                            <Link className={active === "Invoices" ? "is-active" : ""} to="/invoices">Invoices</Link>
                        </>
                    )}
                    {role === "manager" && (
                        <>
                            <Link className={active === "RFQs" ? "is-active" : ""} to="/rfqs">RFQs</Link>
                            <Link className={active === "Approvals" ? "is-active" : ""} to="/approvals">Approvals</Link>
                        </>
                    )}
                    {role === "admin" && (
                        <>
                            <Link className={active === "Vendors" ? "is-active" : ""} to="/vendors">Vendors</Link>
                            <Link className={active === "Purchase Orders" ? "is-active" : ""} to="/purchase-orders">POs</Link>
                            <Link className={active === "Invoices" ? "is-active" : ""} to="/invoices">Invoices</Link>
                        </>
                    )}
                </nav>
                <button 
                    className="vb-profile" 
                    aria-label="User profile"
                    onClick={() => navigate(`/profile/${usernameSlug}`)}
                >
                    {initials}
                </button>
            </div>
        </header>
    );
};

export const ToolbarButton = ({ icon, children, primary = false, onClick }) => (
    <button className={`vb-toolbar-button ${primary ? "is-primary" : ""}`} onClick={onClick}>
        <Icon>{icon}</Icon>
        {children}
    </button>
);

const VendorBridgeShell = ({ active, searchPlaceholder, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="vendorbridge-page">
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div
                    className="vb-sidebar-overlay"
                    aria-hidden="true"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <SideNav
                active={active}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="vb-shell">
                <TopNav
                    active={active}
                    searchPlaceholder={searchPlaceholder}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                />
                <main className="vb-content">{children}</main>
            </div>
        </div>
    );
};

export default VendorBridgeShell;
