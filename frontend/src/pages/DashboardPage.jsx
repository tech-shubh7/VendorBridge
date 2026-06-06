import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import { useAuthStore } from "@/store/authStore";
import { dashboardApi } from "@/api/endpoints/dashboardApi";
import { QUERY_KEYS, ROUTES } from "@/utils/constants";

const formatCurrency = (val) =>
    `₹ ${(parseFloat(val) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
};

const STATUS_TONE = {
    open: "open", draft: "draft", under_review: "evaluating", closed: "closed", cancelled: "suspended",
    pending: "pending", approved: "active", rejected: "suspended",
    sent: "open", fulfilled: "active",
};

const KpiCard = ({ label, value, icon, tone = "primary" }) => (
    <article className="vb-kpi-card">
        <div className="vb-kpi-top">
            <span>{label}</span>
            <Icon className={`tone-text-${tone}`}>{icon}</Icon>
        </div>
        <strong>{value ?? "—"}</strong>
    </article>
);

/* ─── Role-specific Dashboard renderers ─── */
const AdminDashboard = ({ data }) => (
    <>
        <section className="vb-kpi-grid">
            <KpiCard label="Total Users" value={data.stats?.total_users} icon="group" />
            <KpiCard label="Total Vendors" value={data.stats?.total_vendors} icon="factory" />
            <KpiCard label="Active RFQs" value={data.stats?.active_rfqs} icon="request_quote" tone="info" />
            <KpiCard label="Pending Approvals" value={data.stats?.pending_approvals} icon="pending_actions" tone="warning" />
            <KpiCard label="Total Spend" value={formatCurrency(data.stats?.total_procurement_spend)} icon="payments" />
        </section>

        <div className="vb-dashboard-grid">
            <section className="vb-panel vb-panel-wide">
                <div className="vb-panel-header"><h3>Recent RFQs</h3><Link to={ROUTES.RFQS}>View All</Link></div>
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                        <thead><tr><th>RFQ No.</th><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
                        <tbody>
                            {(data.recent?.rfqs || []).map((rfq) => (
                                <tr key={rfq.id}>
                                    <td className="vb-code">{rfq.rfq_number}</td>
                                    <td>{rfq.title}</td>
                                    <td><span className={`vb-rfq-status tone-${STATUS_TONE[rfq.status] || "draft"}`}>{rfq.status}</span></td>
                                    <td>{formatDate(rfq.deadline)}</td>
                                </tr>
                            ))}
                            {!(data.recent?.rfqs?.length) && <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--vb-text-muted)", padding: "24px" }}>No RFQs yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="vb-panel">
                <h3>Quick Actions</h3>
                <div className="vb-action-list">
                    <Link to={ROUTES.VENDORS}><Icon>factory</Icon>Manage Vendors</Link>
                    <Link to={ROUTES.RFQS}><Icon>request_quote</Icon>View RFQs</Link>
                    <Link to={ROUTES.APPROVALS}><Icon>fact_check</Icon>Approvals Queue</Link>
                    <Link to={ROUTES.PURCHASE_ORDERS}><Icon>receipt_long</Icon>Purchase Orders</Link>
                    <Link to={ROUTES.INVOICES}><Icon>receipt</Icon>Invoices</Link>
                </div>
            </section>

            <section className="vb-panel">
                <div className="vb-panel-header"><h3>Recent Users</h3><Link to={ROUTES.MANAGERS}>View All</Link></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                    {(data.recent?.users || []).map((u) => (
                        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="vb-avatar tone-blue" style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                                {u.name?.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "13px" }}>{u.name}</div>
                                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)", textTransform: "capitalize" }}>{u.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="vb-panel">
                <div className="vb-panel-header"><h3>Recent Purchase Orders</h3><Link to={ROUTES.PURCHASE_ORDERS}>View All</Link></div>
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                        <thead><tr><th>PO No.</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                            {(data.recent?.purchase_orders || []).map((po) => (
                                <tr key={po.id}>
                                    <td className="vb-code">{po.po_number}</td>
                                    <td>{po.Vendor?.company_name || "—"}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(po.total_amount)}</td>
                                    <td><span className={`vb-rfq-status tone-${STATUS_TONE[po.status] || "draft"}`}>{po.status}</span></td>
                                </tr>
                            ))}
                            {!(data.recent?.purchase_orders?.length) && <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--vb-text-muted)", padding: "24px" }}>No POs yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </>
);

const ManagerDashboard = ({ data }) => (
    <>
        <section className="vb-kpi-grid">
            <KpiCard label="Pending Approvals" value={data.stats?.pending_approvals} icon="pending_actions" tone="warning" />
            <KpiCard label="Approved" value={data.stats?.approved_count} icon="check_circle" tone="primary" />
            <KpiCard label="Rejected" value={data.stats?.rejected_count} icon="cancel" tone="info" />
            <KpiCard label="Total Handled" value={data.stats?.total_handled} icon="fact_check" />
        </section>
        <div className="vb-dashboard-grid">
            <section className="vb-panel vb-panel-wide">
                <div className="vb-panel-header"><h3>Pending Approval Queue</h3><Link to={ROUTES.APPROVALS}>View All</Link></div>
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                        <thead><tr><th>Quotation No.</th><th>RFQ</th><th>Amount</th></tr></thead>
                        <tbody>
                            {(data.recent?.approval_queue || []).map((a) => (
                                <tr key={a.id}>
                                    <td className="vb-code">{a.Quotation?.quotation_number}</td>
                                    <td>{a.Quotation?.Rfq?.title || "—"}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(a.Quotation?.total_amount)}</td>
                                </tr>
                            ))}
                            {!(data.recent?.approval_queue?.length) && <tr><td colSpan="3" style={{ textAlign: "center", color: "var(--vb-text-muted)", padding: "24px" }}>No pending approvals</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
            <section className="vb-panel">
                <h3>Quick Actions</h3>
                <div className="vb-action-list">
                    <Link to={ROUTES.APPROVALS}><Icon>fact_check</Icon>Review Approvals</Link>
                    <Link to={ROUTES.RFQS}><Icon>request_quote</Icon>Browse RFQs</Link>
                    <Link to={ROUTES.QUOTATIONS}><Icon>rate_review</Icon>Quotations</Link>
                </div>
            </section>
        </div>
    </>
);

const OfficerDashboard = ({ data }) => (
    <>
        <section className="vb-kpi-grid">
            <KpiCard label="My Active RFQs" value={data.stats?.my_active_rfqs} icon="request_quote" tone="info" />
            <KpiCard label="All Active RFQs" value={data.stats?.total_active_rfqs} icon="request_quote" />
            <KpiCard label="Pending Quotations" value={data.stats?.pending_quotations} icon="rate_review" tone="warning" />
            <KpiCard label="Pending Approvals" value={data.stats?.pending_approvals} icon="pending_actions" tone="warning" />
            <KpiCard label="Monthly Spend" value={formatCurrency(data.stats?.monthly_spend)} icon="payments" />
        </section>
        <div className="vb-dashboard-grid">
            <section className="vb-panel vb-panel-wide">
                <div className="vb-panel-header"><h3>My Recent RFQs</h3><Link to={ROUTES.RFQS}>View All</Link></div>
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                        <thead><tr><th>RFQ No.</th><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
                        <tbody>
                            {(data.recent?.rfqs || []).map((rfq) => (
                                <tr key={rfq.id}>
                                    <td className="vb-code">{rfq.rfq_number}</td>
                                    <td>{rfq.title}</td>
                                    <td><span className={`vb-rfq-status tone-${STATUS_TONE[rfq.status] || "draft"}`}>{rfq.status}</span></td>
                                    <td>{formatDate(rfq.deadline)}</td>
                                </tr>
                            ))}
                            {!(data.recent?.rfqs?.length) && <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--vb-text-muted)", padding: "24px" }}>No RFQs yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
            <section className="vb-panel">
                <h3>Quick Actions</h3>
                <div className="vb-action-list">
                    <Link to={ROUTES.RFQ_NEW}><Icon>post_add</Icon>Create New RFQ</Link>
                    <Link to={ROUTES.APPROVALS}><Icon>fact_check</Icon>View Approvals</Link>
                    <Link to={ROUTES.PURCHASE_ORDERS}><Icon>receipt_long</Icon>Purchase Orders</Link>
                    <Link to={ROUTES.INVOICES}><Icon>receipt</Icon>Invoices</Link>
                </div>
            </section>
        </div>
    </>
);

const VendorDashboard = ({ data }) => (
    <>
        <section className="vb-kpi-grid">
            <KpiCard label="Assigned RFQs" value={data.stats?.assigned_rfqs} icon="request_quote" tone="info" />
            <KpiCard label="Submitted Quotations" value={data.stats?.submitted_quotations} icon="rate_review" />
            <KpiCard label="Accepted Quotations" value={data.stats?.accepted_quotations} icon="check_circle" tone="primary" />
            <KpiCard label="Purchase Orders" value={data.stats?.purchase_orders} icon="receipt_long" tone="info" />
        </section>
        <div className="vb-dashboard-grid">
            <section className="vb-panel vb-panel-wide">
                <div className="vb-panel-header"><h3>Recent RFQs Assigned</h3><Link to={ROUTES.QUOTATIONS}>View All</Link></div>
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                        <thead><tr><th>RFQ No.</th><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
                        <tbody>
                            {(data.recent?.rfqs || []).filter(Boolean).map((rfq) => (
                                <tr key={rfq?.id}>
                                    <td className="vb-code">{rfq?.rfq_number}</td>
                                    <td>{rfq?.title}</td>
                                    <td><span className={`vb-rfq-status tone-${STATUS_TONE[rfq?.status] || "draft"}`}>{rfq?.status}</span></td>
                                    <td>{formatDate(rfq?.deadline)}</td>
                                </tr>
                            ))}
                            {!(data.recent?.rfqs?.length) && <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--vb-text-muted)", padding: "24px" }}>No RFQs assigned yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
            <section className="vb-panel">
                <h3>Quick Actions</h3>
                <div className="vb-action-list">
                    <Link to={ROUTES.QUOTATIONS}><Icon>rate_review</Icon>Submit Quotation</Link>
                </div>
            </section>
        </div>
    </>
);

/* ─── Main ─── */
const DashboardPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";

    const { data: resp, isLoading, isError } = useQuery({
        queryKey: QUERY_KEYS.DASHBOARD,
        queryFn: () => dashboardApi.get().then((r) => r.data?.data),
        staleTime: 1000 * 30,
    });

    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--vb-text-muted)", flexDirection: "column", gap: "12px" }}>
                    <Icon style={{ fontSize: "40px" }}>autorenew</Icon>
                    <span>Loading dashboard…</span>
                </div>
            );
        }
        if (isError || !resp) {
            return (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--vb-error)" }}>
                    Failed to load dashboard data. Please refresh.
                </div>
            );
        }

        switch (resp.role || role) {
            case "admin": return <AdminDashboard data={resp} />;
            case "manager": return <ManagerDashboard data={resp} />;
            case "procurement_officer": case "officer": return <OfficerDashboard data={resp} />;
            case "vendor": return <VendorDashboard data={resp} />;
            default: return <AdminDashboard data={resp} />;
        }
    };

    return (
        <VendorBridgeShell active="Dashboard" searchPlaceholder="Search across VendorBridge…">
            <section className="vb-page-header is-flat">
                <div>
                    <h2>Dashboard</h2>
                    <p>Real-time overview of procurement operations.</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="refresh" onClick={() => window.location.reload()}>Refresh</ToolbarButton>
                </div>
            </section>
            {renderContent()}
        </VendorBridgeShell>
    );
};

export default DashboardPage;
