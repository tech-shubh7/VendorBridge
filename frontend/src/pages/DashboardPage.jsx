import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { dashboardApi } from "@/api/endpoints/dashboardApi";
import { QUERY_KEYS } from "@/utils/constants";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => {
    if (n === null || n === undefined) return "—";
    if (typeof n === "number") {
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
        return n.toLocaleString();
    }
    return n;
};

const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
};

const statusBadge = (status = "") => {
    const s = status.toLowerCase();
    const map = {
        open: "info", active: "info", published: "info",
        pending: "warning", draft: "warning",
        approved: "primary", accepted: "primary", awarded: "primary",
        rejected: "rose", cancelled: "rose", closed: "rose",
        submitted: "warning",
    };
    return map[s] || "info";
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const Skeleton = ({ h = "1rem", w = "100%", radius = "6px" }) => (
    <span
        style={{
            display: "block", height: h, width: w,
            background: "linear-gradient(90deg,var(--vb-border) 25%,var(--vb-bg-raised) 50%,var(--vb-border) 75%)",
            backgroundSize: "200% 100%",
            animation: "vb-shimmer 1.4s infinite",
            borderRadius: radius,
        }}
    />
);

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, tone = "primary", money = false }) => (
    <article className="vb-kpi-card">
        <div className="vb-kpi-top">
            <span>{label}</span>
            <Icon className={`tone-text-${tone}`}>{icon}</Icon>
        </div>
        <strong>{money ? fmt(value) : (value ?? "—")}</strong>
    </article>
);

const KpiSkeleton = () => (
    <article className="vb-kpi-card" style={{ gap: "0.75rem" }}>
        <Skeleton h="0.8rem" w="60%" />
        <Skeleton h="2rem" w="40%" />
    </article>
);

// ─── Breakdown Table ─────────────────────────────────────────────────────────

const BreakdownTable = ({ title, rows }) => {
    const firstColumnHeader = title.toLowerCase().includes("role") ? "Role" : "Status";
    return (
        <section className="vb-panel">
            <h3>{title}</h3>
            <table className="vb-data-table" style={{ marginTop: "0.75rem" }}>
                <thead>
                    <tr>
                        <th>{firstColumnHeader}</th>
                        <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {rows?.length ? rows.map((r) => (
                        <tr key={r.status}>
                            <td>
                                <span className={`vb-badge tone-${statusBadge(r.status)}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{r.count ?? r._count ?? "—"}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={2} style={{ color: "var(--vb-text-muted)", textAlign: "center", padding: "16px 0" }}>
                                No data
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
};

// ─── Recent Table ─────────────────────────────────────────────────────────────

const RecentTable = ({ title, columns, rows, emptyMsg = "No recent records" }) => (
    <section className="vb-panel" style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>{title}</h3>
        <div style={{ overflowX: "auto" }}>
            <table className="vb-data-table">
                <thead>
                    <tr>{columns.map((c) => <th key={c.key} style={c.right ? { textAlign: "right" } : {}}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                    {rows?.length ? rows.map((row, i) => (
                        <tr key={i}>
                            {columns.map((c) => (
                                <td key={c.key} style={c.right ? { textAlign: "right" } : {}}>
                                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr><td colSpan={columns.length} style={{ color: "var(--vb-text-muted)", textAlign: "center" }}>{emptyMsg}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </section>
);

// ─── Role-specific dashboard views ───────────────────────────────────────────

/** ADMIN */
const AdminDashboard = ({ data }) => {
    const { stats, breakdowns, recent } = data;
    const kpis = [
        { label: "Total Users", value: stats.total_users, icon: "group", tone: "primary" },
        { label: "Total Vendors", value: stats.total_vendors, icon: "factory", tone: "info" },
        { label: "Active RFQs", value: stats.active_rfqs, icon: "request_quote", tone: "info" },
        { label: "Pending Approvals", value: stats.pending_approvals, icon: "pending_actions", tone: "warning" },
        { label: "Total Procurement Spend", value: stats.total_procurement_spend, icon: "payments", tone: "primary", money: true },
    ];

    return (
        <>
            <section className="vb-kpi-grid">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </section>

            <div className="vb-dashboard-grid">
                {/* Users by Role */}
                <BreakdownTable
                    title="Users by Role"
                    rows={breakdowns.users_by_role?.map((r) => ({ status: r.role, count: r._count?.id ?? r.count }))}
                />

                {/* RFQs by Status */}
                <BreakdownTable
                    title="RFQs by Status"
                    rows={breakdowns.rfqs_by_status?.map((r) => ({ status: r.status, count: r._count?.id ?? r.count }))}
                />

                {/* Quick Actions */}
                <section className="vb-panel">
                    <h3>Quick Actions</h3>
                    <div className="vb-action-list">
                        <Link to="/?addVendor=true"><Icon>domain_add</Icon>Create Vendor</Link>
                        <Link to="/rfqs/new"><Icon>post_add</Icon>Create RFQ</Link>
                        <Link to="/managers"><Icon>supervisor_account</Icon>Manage Managers</Link>
                        <Link to="/officers"><Icon>assignment_ind</Icon>Manage Officers</Link>
                    </div>
                </section>

                {/* Recent Users */}
                <RecentTable
                    title="Recent Users"
                    columns={[
                        { key: "username", label: "Username" },
                        { key: "email", label: "Email" },
                        { key: "role", label: "Role", render: (r) => <span className={`vb-badge tone-${statusBadge(r.role)}`}>{r.role}</span> },
                        { key: "createdAt", label: "Joined", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.users}
                />

                {/* Recent RFQs */}
                <RecentTable
                    title="Recent RFQs"
                    columns={[
                        { key: "rfq_number", label: "RFQ #" },
                        { key: "title", label: "Title" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "createdAt", label: "Date", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.rfqs}
                />

                {/* Recent POs */}
                <RecentTable
                    title="Recent Purchase Orders"
                    columns={[
                        { key: "po_number", label: "PO #" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "total_amount", label: "Amount", right: true, render: (r) => fmt(r.total_amount) },
                        { key: "createdAt", label: "Date", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.purchase_orders}
                />
            </div>
        </>
    );
};

/** PROCUREMENT OFFICER */
const OfficerDashboard = ({ data }) => {
    const { stats, breakdowns, recent } = data;
    const kpis = [
        { label: "My Active RFQs", value: stats.my_active_rfqs, icon: "request_quote", tone: "primary" },
        { label: "Total Active RFQs", value: stats.total_active_rfqs, icon: "list_alt", tone: "info" },
        { label: "Pending Quotations", value: stats.pending_quotations, icon: "rate_review", tone: "warning" },
        { label: "Pending Approvals", value: stats.pending_approvals, icon: "pending_actions", tone: "warning" },
        { label: "Monthly Spend", value: stats.monthly_spend, icon: "payments", tone: "primary", money: true },
    ];

    return (
        <>
            <section className="vb-kpi-grid">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </section>

            <div className="vb-dashboard-grid">
                {/* RFQs by Status */}
                <BreakdownTable
                    title="RFQs by Status"
                    rows={breakdowns.rfqs_by_status?.map((r) => ({ status: r.status, count: r._count?.id ?? r.count }))}
                />

                {/* Quick Actions */}
                <section className="vb-panel">
                    <h3>Quick Actions</h3>
                    <div className="vb-action-list">
                        <Link to="/rfqs/new"><Icon>post_add</Icon>Create RFQ</Link>
                        <Link to="/rfqs"><Icon>list_alt</Icon>View All RFQs</Link>
                        <Link to="/quotations"><Icon>rate_review</Icon>Review Quotations</Link>
                    </div>
                </section>

                {/* Recent RFQs */}
                <RecentTable
                    title="My Recent RFQs"
                    columns={[
                        { key: "rfq_number", label: "RFQ #" },
                        { key: "title", label: "Title" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "deadline", label: "Deadline", render: (r) => fmtDate(r.deadline) },
                    ]}
                    rows={recent.rfqs}
                />

                {/* Recent POs */}
                <RecentTable
                    title="Recent Purchase Orders"
                    columns={[
                        { key: "po_number", label: "PO #" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "total_amount", label: "Amount", right: true, render: (r) => fmt(r.total_amount) },
                        { key: "createdAt", label: "Date", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.purchase_orders}
                />

                {/* Recent Invoices */}
                <RecentTable
                    title="Recent Invoices"
                    columns={[
                        { key: "invoice_number", label: "Invoice #" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "amount", label: "Amount", right: true, render: (r) => fmt(r.amount) },
                        { key: "due_date", label: "Due Date", render: (r) => fmtDate(r.due_date) },
                    ]}
                    rows={recent.invoices}
                />
            </div>
        </>
    );
};

/** MANAGER */
const ManagerDashboard = ({ data }) => {
    const { stats, breakdowns, recent } = data;
    const kpis = [
        { label: "Pending Approvals", value: stats.pending_approvals, icon: "pending_actions", tone: "warning" },
        { label: "Approved", value: stats.approved_count, icon: "check_circle", tone: "primary" },
        { label: "Rejected", value: stats.rejected_count, icon: "cancel", tone: "rose" },
        { label: "Total Handled", value: stats.total_handled, icon: "task_alt", tone: "info" },
    ];

    return (
        <>
            <section className="vb-kpi-grid">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </section>

            <div className="vb-dashboard-grid">
                {/* Approvals by Status */}
                <BreakdownTable
                    title="Approvals by Status"
                    rows={breakdowns.approvals_by_status?.map((r) => ({ status: r.status, count: r._count?.id ?? r.count }))}
                />

                {/* Quick Actions */}
                <section className="vb-panel">
                    <h3>Quick Actions</h3>
                    <div className="vb-action-list">
                        <Link to="/rfqs"><Icon>list_alt</Icon>Review RFQs</Link>
                        <Link to="/quotations"><Icon>rate_review</Icon>View Quotations</Link>
                    </div>
                </section>

                {/* Approval Queue */}
                <RecentTable
                    title="Approval Queue"
                    columns={[
                        { key: "rfq_number", label: "RFQ #", render: (r) => r.Rfq?.rfq_number ?? r.rfq_number ?? "—" },
                        { key: "title", label: "Title", render: (r) => r.Rfq?.title ?? r.title ?? "—" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "createdAt", label: "Requested", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.approval_queue}
                    emptyMsg="No pending approvals 🎉"
                />

                {/* Recently Acted */}
                <RecentTable
                    title="Recently Acted"
                    columns={[
                        { key: "rfq_number", label: "RFQ #", render: (r) => r.Rfq?.rfq_number ?? r.rfq_number ?? "—" },
                        { key: "title", label: "Title", render: (r) => r.Rfq?.title ?? r.title ?? "—" },
                        { key: "status", label: "Decision", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "updatedAt", label: "Acted On", render: (r) => fmtDate(r.updatedAt) },
                    ]}
                    rows={recent.recently_acted}
                />
            </div>
        </>
    );
};

/** VENDOR */
const VendorDashboard = ({ data }) => {
    const { stats, vendor_profile, breakdowns, recent } = data;
    const kpis = [
        { label: "Assigned RFQs", value: stats.assigned_rfqs, icon: "request_quote", tone: "info" },
        { label: "Submitted Quotations", value: stats.submitted_quotations, icon: "rate_review", tone: "primary" },
        { label: "Accepted Quotations", value: stats.accepted_quotations, icon: "check_circle", tone: "primary" },
        { label: "Purchase Orders", value: stats.purchase_orders, icon: "receipt_long", tone: "info" },
    ];

    return (
        <>
            {/* Vendor Profile Card */}
            {vendor_profile && (
                <section className="vb-panel" style={{ marginBottom: "1rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "var(--vb-accent)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "1.5rem", fontWeight: 700, color: "#fff",
                        }}>
                            {vendor_profile.company_name?.charAt(0)?.toUpperCase() ?? "V"}
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{vendor_profile.company_name}</p>
                            <p style={{ color: "var(--vb-text-muted)", fontSize: "0.8rem" }}>{vendor_profile.category}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Icon key={star} className={star <= Math.round(vendor_profile.rating || 0) ? "tone-text-warning" : ""}>
                                {star <= Math.round(vendor_profile.rating || 0) ? "star" : "star_border"}
                            </Icon>
                        ))}
                        <span style={{ color: "var(--vb-text-muted)", fontSize: "0.85rem" }}>
                            {vendor_profile.rating ? vendor_profile.rating.toFixed(1) : "Not rated"}
                        </span>
                    </div>
                </section>
            )}

            <section className="vb-kpi-grid">
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </section>

            <div className="vb-dashboard-grid">
                {/* Quotations by Status */}
                <BreakdownTable
                    title="Quotations by Status"
                    rows={breakdowns.quotations_by_status?.map((r) => ({ status: r.status, count: r._count?.id ?? r.count }))}
                />

                {/* Quick Actions */}
                <section className="vb-panel">
                    <h3>Quick Actions</h3>
                    <div className="vb-action-list">
                        <Link to="/quotations"><Icon>rate_review</Icon>My Quotations</Link>
                    </div>
                </section>

                {/* Recent RFQs */}
                <RecentTable
                    title="Assigned RFQs"
                    columns={[
                        { key: "rfq_number", label: "RFQ #" },
                        { key: "title", label: "Title" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "deadline", label: "Deadline", render: (r) => fmtDate(r.deadline) },
                    ]}
                    rows={recent.rfqs}
                />

                {/* Recent Quotations */}
                <RecentTable
                    title="Recent Quotations"
                    columns={[
                        { key: "quotation_number", label: "Quotation #" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "total_amount", label: "Amount", right: true, render: (r) => fmt(r.total_amount) },
                        { key: "createdAt", label: "Submitted", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.quotations}
                />

                {/* Recent POs */}
                <RecentTable
                    title="Purchase Orders"
                    columns={[
                        { key: "po_number", label: "PO #" },
                        { key: "status", label: "Status", render: (r) => <span className={`vb-badge tone-${statusBadge(r.status)}`}>{r.status}</span> },
                        { key: "total_amount", label: "Amount", right: true, render: (r) => fmt(r.total_amount) },
                        { key: "createdAt", label: "Date", render: (r) => fmtDate(r.createdAt) },
                    ]}
                    rows={recent.purchase_orders}
                />
            </div>
        </>
    );
};

// ─── Title per role ──────────────────────────────────────────────────────────

const ROLE_META = {
    admin: { title: "Executive Dashboard", subtitle: "Real-time overview of all procurement operations." },
    officer: { title: "Procurement Dashboard", subtitle: "Track your RFQs, quotations, and monthly spend." },
    manager: { title: "Approvals Dashboard", subtitle: "Manage and act on pending procurement approvals." },
    vendor: { title: "Vendor Dashboard", subtitle: "Your RFQs, quotations, and purchase orders at a glance." },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [...QUERY_KEYS.DASHBOARD, role],
        queryFn: async () => {
            const res = await dashboardApi.get();
            return res.data?.data ?? res.data;
        },
        staleTime: 30_000,   // 30 seconds
        refetchInterval: 60_000, // auto-refresh every minute
    });

    const meta = ROLE_META[role] || ROLE_META.admin;

    const renderContent = () => {
        if (isLoading) {
            return (
                <section className="vb-kpi-grid">
                    {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
                </section>
            );
        }
        if (isError || !data) {
            return (
                <section className="vb-panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <Icon style={{ fontSize: "3rem", color: "var(--vb-text-muted)" }}>cloud_off</Icon>
                    <p style={{ marginTop: "1rem", fontWeight: 600 }}>Failed to load dashboard</p>
                    <p style={{ color: "var(--vb-text-muted)", fontSize: "0.875rem" }}>
                        Check your connection or try again.
                    </p>
                    <button className="vb-toolbar-button is-primary" style={{ margin: "1.5rem auto 0" }} onClick={() => refetch()}>
                        <Icon>refresh</Icon> Retry
                    </button>
                </section>
            );
        }

        if (role === "admin") return <AdminDashboard data={data} />;
        if (role === "officer") return <OfficerDashboard data={data} />;
        if (role === "manager") return <ManagerDashboard data={data} />;
        if (role === "vendor") return <VendorDashboard data={data} />;
        return <AdminDashboard data={data} />;
    };

    return (
        <VendorBridgeShell active="Dashboard" searchPlaceholder="Search across VendorBridge...">
            <section className="vb-page-header is-flat">
                <div>
                    <h2>{meta.title}</h2>
                    <p>{meta.subtitle}</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="refresh" onClick={() => refetch()}>Refresh</ToolbarButton>
                </div>
            </section>

            {renderContent()}
        </VendorBridgeShell>
    );
};

export default DashboardPage;
