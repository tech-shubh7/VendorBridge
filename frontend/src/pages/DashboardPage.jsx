import { Link } from "react-router-dom";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import { useAuthStore } from "@/store/authStore";

const kpis = [
    { label: "Active Vendors", value: "124", delta: "12%", trend: "up", icon: "factory" },
    { label: "Open RFQs", value: "18", delta: "4%", trend: "up", icon: "request_quote", tone: "info" },
    { label: "Pending Approvals", value: "7", delta: "0%", trend: "flat", icon: "pending_actions", tone: "warning" },
    { label: "Monthly Spend", value: "$450k", delta: "2%", trend: "down", icon: "payments" },
    { label: "Active POs", value: "42", delta: "8%", trend: "up", icon: "receipt_long", tone: "info" },
    { label: "Pending Invoices", value: "12", delta: "3%", trend: "down", icon: "receipt", tone: "warning" },
];

const activity = [
    ["primary", "RFQ-2023-089 approved by Sarah Jenkins", "10 mins ago"],
    ["info", "New Vendor Global Tech Supplies onboarded.", "45 mins ago"],
    ["warning", "PO-9921 requires secondary approval.", "2 hours ago"],
    ["rose", "Contract CON-004 expires in 30 days.", "5 hours ago"],
];

const DashboardPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";

    return (
        <VendorBridgeShell active="Dashboard" searchPlaceholder="Search across VendorBridge...">
        <section className="vb-page-header is-flat">
            <div>
                <h2>Executive Dashboard</h2>
                <p>Real-time overview of procurement operations.</p>
            </div>
            <div className="vb-toolbar">
                <ToolbarButton icon="filter_list">Filter</ToolbarButton>
                <ToolbarButton icon="download">Export</ToolbarButton>
            </div>
        </section>

        <section className="vb-kpi-grid">
            {kpis.map((kpi) => (
                <article className="vb-kpi-card" key={kpi.label}>
                    <div className="vb-kpi-top">
                        <span>{kpi.label}</span>
                        <Icon className={`tone-text-${kpi.tone || "primary"}`}>{kpi.icon}</Icon>
                    </div>
                    <strong>{kpi.value}</strong>
                    <div className={`vb-kpi-trend tone-${kpi.trend}`}>
                        <Icon>{kpi.trend === "flat" ? "horizontal_rule" : kpi.trend === "up" ? "arrow_upward" : "arrow_downward"}</Icon>
                        {kpi.delta}
                    </div>
                </article>
            ))}
        </section>

        <div className="vb-dashboard-grid">
            <section className="vb-panel vb-panel-wide">
                <div className="vb-panel-header">
                    <h3>Procurement Spend Trend</h3>
                    <select defaultValue="Last 6 Months">
                        <option>Last 6 Months</option>
                        <option>This Year</option>
                        <option>Last Year</option>
                    </select>
                </div>
                <div className="vb-area-chart">
                    <div className="vb-area-fill" />
                    <span>[ Area Chart Visualization ]</span>
                </div>
            </section>

            <section className="vb-panel">
                <h3>Quick Actions</h3>
                <div className="vb-action-list">
                    {(role === "admin" || role === "procurement_officer" || role === "officer") && (
                        <>
                            <Link to="/?addVendor=true"><Icon>domain_add</Icon>Create Vendor</Link>
                            <Link to="/rfqs/new"><Icon>post_add</Icon>Create RFQ</Link>
                        </>
                    )}
                    {(role === "admin" || role === "manager" || role === "procurement_officer" || role === "officer") && (
                        <Link to="/approvals"><Icon>fact_check</Icon>View Approvals</Link>
                    )}
                    {(role === "admin" || role === "procurement_officer" || role === "officer") && (
                        <button><Icon>receipt_long</Icon>Generate PO</button>
                    )}
                    {role === "vendor" && (
                        <Link to="/quotations"><Icon>rate_review</Icon>Submit Quotation</Link>
                    )}
                </div>
            </section>

            <section className="vb-panel">
                <h3>Vendor Performance</h3>
                <div className="vb-bar-chart" aria-label="Vendor performance chart">
                    {[60, 85, 40, 70, 50].map((height) => <span style={{ "--bar-height": `${height}%` }} key={height} />)}
                </div>
            </section>

            <section className="vb-panel">
                <h3>RFQ Status</h3>
                <div className="vb-donut"><strong>18</strong></div>
            </section>

            <section className="vb-panel vb-activity-panel">
                <div className="vb-panel-header">
                    <h3>Recent Activity</h3>
                    <a href="#">View All</a>
                </div>
                <div className="vb-activity-list">
                    {activity.map(([tone, text, time]) => (
                        <div className="vb-activity-item" key={text}>
                            <span className={`tone-dot-${tone}`} />
                            <div>
                                <p>{text}</p>
                                <small>{time}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    </VendorBridgeShell>
    );
};

export default DashboardPage;
