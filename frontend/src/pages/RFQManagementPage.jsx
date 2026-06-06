import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRFQStore } from "@/store/rfqStore";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";

const STATUS_FILTERS = ["All", "draft", "open", "evaluating", "closed"];

const STATUS_LABEL = {
    draft: "Draft",
    open: "Open",
    evaluating: "Evaluating",
    closed: "Closed",
};

const STATUS_TONE = {
    draft: "draft",
    open: "open",
    evaluating: "evaluating",
    closed: "closed",
};

const RFQStatus = ({ status }) => {
    const tone = STATUS_TONE[status] || "draft";
    const label = STATUS_LABEL[status] || status;
    return (
        <span className={`vb-rfq-status tone-${tone}`}>
            {tone === "open" ? <span /> : null}
            {label}
        </span>
    );
};

const formatDeadline = (iso) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    } catch {
        return iso;
    }
};

const RFQRow = ({ rfq, onClick }) => (
    <tr onClick={() => onClick(rfq)} style={{ cursor: "pointer" }}>
        <td>
            <input
                type="checkbox"
                aria-label={`Select ${rfq.rfq_number}`}
                onClick={(e) => e.stopPropagation()}
            />
        </td>
        <td className="vb-code vb-primary-code">{rfq.rfq_number || "—"}</td>
        <td className="vb-company vb-truncate" title={rfq.title}>{rfq.title}</td>
        <td>{formatDeadline(rfq.deadline)}</td>
        <td className="vb-center">
            <span className="vb-count-pill">{rfq.vendors_invited_count ?? "—"}</span>
        </td>
        <td className="vb-center">
            <span className="vb-count-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                {rfq.quotations_received_count ?? "0"}
            </span>
        </td>
        <td>
            <RFQStatus status={rfq.status} />
        </td>
        <td>
            <div className="vb-row-actions">
                <button aria-label={`View ${rfq.rfq_number}`} onClick={(e) => { e.stopPropagation(); onClick(rfq); }}>
                    <Icon>visibility</Icon>
                </button>
            </div>
        </td>
    </tr>
);

import { useAuthStore } from "@/store/authStore";

const RFQManagementPage = () => {
    const navigate = useNavigate();
    const { rfqs, pagination, isLoading, error, fetchRFQs } = useRFQStore();

    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        const params = {
            page,
            limit,
            ...(activeFilter !== "All" && { status: activeFilter }),
            ...(search.trim() && { search: search.trim() }),
        };
        fetchRFQs(params);
    }, [page, activeFilter, search]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (f) => {
        setActiveFilter(f);
        setPage(1);
    };

    return (
        <VendorBridgeShell
            active="RFQs"
            searchPlaceholder="Search RFQs or title..."
            onSearch={handleSearchChange}
            searchValue={search}
        >
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
                    <ToolbarButton icon="add" primary onClick={() => navigate("/rfqs/new")}>
                        Add New RFQ
                    </ToolbarButton>
                </div>
            </section>

            {/* Status filter tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => handleFilterChange(f)}
                        style={{
                            padding: "6px 16px",
                            borderRadius: "999px",
                            border: "1px solid",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: activeFilter === f ? "600" : "400",
                            background: activeFilter === f ? "var(--vb-primary)" : "transparent",
                            color: activeFilter === f ? "white" : "var(--vb-text-secondary)",
                            borderColor: activeFilter === f ? "var(--vb-primary)" : "var(--vb-border-subtle)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {f === "All" ? "All RFQs" : STATUS_LABEL[f] || f}
                    </button>
                ))}
            </div>

            <section className="vb-table-card">
                <div className="vb-table-toolbar">
                    <span>
                        {isLoading
                            ? "Loading…"
                            : `Showing ${rfqs.length} of ${pagination.total} results`}
                    </span>
                </div>

                {error && (
                    <div style={{ padding: "16px", color: "var(--vb-danger)", textAlign: "center" }}>
                        ⚠ {error}
                    </div>
                )}

                <div className="vb-table-wrap">
                    <table className="vb-vendor-table vb-rfq-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all RFQs" /></th>
                                <th>RFQ Number <Icon>arrow_downward</Icon></th>
                                <th>Title</th>
                                <th>Deadline</th>
                                <th>Vendors Invited</th>
                                <th>Quotations</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                        <Icon style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>autorenew</Icon>
                                        <br />Loading RFQs…
                                    </td>
                                </tr>
                            ) : rfqs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                        No RFQs found.{" "}
                                        <button
                                            onClick={() => navigate("/rfqs/new")}
                                            style={{ color: "var(--vb-primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                        >
                                            Create your first RFQ
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                rfqs.map((rfq) => (
                                    <RFQRow
                                        rfq={rfq}
                                        key={rfq.id}
                                        onClick={(r) => navigate(`/rfqs/${r.id}`)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <div className="vb-pagination-controls">
                        <span>Rows per page:</span>
                        <select defaultValue={limit} disabled>
                            <option>10</option>
                            <option>20</option>
                        </select>
                    </div>
                    <div className="vb-pagination-controls">
                        <span>
                            Page {pagination.page} of {pagination.totalPages || 1}
                        </span>
                        <div className="vb-pages">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <Icon>chevron_left</Icon>
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                                disabled={page >= (pagination.totalPages || 1)}
                            >
                                <Icon>chevron_right</Icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </section>
        </VendorBridgeShell>
    );
};

export default RFQManagementPage;
