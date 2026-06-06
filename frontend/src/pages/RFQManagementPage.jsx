import { useNavigate } from "react-router-dom";
import { useRFQStore } from "@/store/rfqStore";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";

const filters = ["All RFQs", "Draft", "Open", "Evaluating", "Closed"];

const getVendorDetails = (email) => {
    if (email === "vendor@company.com" || email === "sarah.jenkins@vendorbridge.com") {
        return { initials: "AC", tone: "green", name: "Acme Corp Logistics", email };
    }
    if (email === "michael.ross@vendorbridge.com") {
        return { initials: "TP", tone: "blue", name: "TechPro Hardware Solutions", email };
    }
    if (email === "priya.patel@vendorbridge.com") {
        return { initials: "GO", tone: "gray", name: "Global Office Supplies Ltd", email };
    }
    if (email === "david.lee@vendorbridge.com") {
        return { initials: "AI", tone: "rose", name: "Apex Industrial Materials", email };
    }
    return { initials: email.slice(0, 2).toUpperCase(), tone: "gray", name: email, email };
};

const AssignedVendors = ({ emails }) => {
    if (!emails || !emails.length) {
        return <span className="vb-empty-cell">Unassigned</span>;
    }

    const mapped = emails.map(getVendorDetails);
    const display = mapped.slice(0, 2);
    const moreVendors = Math.max(0, mapped.length - 2);

    return (
        <div className="vb-avatar-stack">
            {display.map((vendor) => (
                <span className={`vb-avatar tone-${vendor.tone}`} title={vendor.name} key={vendor.email}>
                    {vendor.initials}
                </span>
            ))}
            {moreVendors > 0 ? <span className="vb-avatar tone-gray">+{moreVendors}</span> : null}
        </div>
    );
};

const RFQStatus = ({ status, tone }) => (
    <span className={`vb-rfq-status tone-${tone}`}>
        {tone === "open" ? <span /> : null}
        {status}
    </span>
);

const RFQRow = ({ rfq }) => (
    <tr className={rfq.striped ? "is-striped" : ""}>
        <td>
            <input type="checkbox" aria-label={`Select ${rfq.code}`} />
        </td>
        <td className="vb-code vb-primary-code">{rfq.code}</td>
        <td className="vb-company vb-truncate" title={rfq.title}>{rfq.title}</td>
        <td>{rfq.category}</td>
        <td>{rfq.deadline}</td>
        <td className="vb-center">
            <span className="vb-count-pill">{rfq.items?.length || 0}</span>
        </td>
        <td>
            <AssignedVendors emails={rfq.invitedVendors} />
        </td>
        <td>
            <RFQStatus status={rfq.status} tone={rfq.statusTone} />
        </td>
        <td>
            <div className="vb-row-actions">
                <button aria-label={`View ${rfq.code}`}>
                    <Icon>visibility</Icon>
                </button>
                <button aria-label={`Edit ${rfq.code}`}>
                    <Icon>edit</Icon>
                </button>
            </div>
        </td>
    </tr>
);

import { useAuthStore } from "@/store/authStore";

const RFQManagementPage = () => {
    const navigate = useNavigate();
    const rfqs = useRFQStore((state) => state.rfqs);
    const { user } = useAuthStore();
    const role = user?.role || "admin";

    return (
        <VendorBridgeShell active="RFQs" searchPlaceholder="Search RFQs or Vendors...">
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>RFQs</span>
            </div>

            <section className="vb-page-header">
                <div>
                    <h2>RFQ Management</h2>
                    <p>Manage and track your requests for quotations.</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="filter_list">Filters</ToolbarButton>
                    <ToolbarButton icon="download">Export</ToolbarButton>
                    {(role === "admin" || role === "procurement_officer" || role === "officer") && (
                        <ToolbarButton icon="add" primary onClick={() => navigate("/rfqs/new")}>Add New RFQ</ToolbarButton>
                    )}
                </div>
            </section>

            <section className="vb-table-card">
                <div className="vb-table-toolbar">
                    <span>Showing 1-{rfqs.length} of {rfqs.length} results</span>
                    <label>
                        Sort by:
                        <select defaultValue="Newest First">
                            <option>Newest First</option>
                            <option>Deadline Ascending</option>
                            <option>Status</option>
                        </select>
                    </label>
                </div>

                <div className="vb-table-wrap">
                    <table className="vb-vendor-table vb-rfq-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all RFQs" /></th>
                                <th>RFQ Code <Icon>arrow_downward</Icon></th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Deadline</th>
                                <th>Items</th>
                                <th>Assigned Vendors</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rfqs.map((rfq) => (
                                <RFQRow rfq={rfq} key={rfq.code} />
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <div className="vb-pagination-controls">
                        <span>Rows per page:</span>
                        <select defaultValue="10">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                    </div>
                    <div className="vb-pagination-controls">
                        <span>1-{rfqs.length} of {rfqs.length}</span>
                        <div className="vb-pages">
                            <button disabled><Icon>chevron_left</Icon></button>
                            <button disabled><Icon>chevron_right</Icon></button>
                        </div>
                    </div>
                </footer>
            </section>
        </VendorBridgeShell>
    );
};

export default RFQManagementPage;
