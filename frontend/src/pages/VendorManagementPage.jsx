import { useState, useCallback } from "react";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import useVendors from "@/features/vendors/hooks/useVendors";
import {
    useCreateVendor,
    useUpdateVendor,
    useDeleteVendor,
    useToggleVendorStatus,
} from "@/features/vendors/hooks/useVendorMutations";

/* ─── Helpers ─────────────────────────────────────────── */
const getInitials = (name) =>
    name ? name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "V";

const getAvatarTone = (id = "") => {
    const tones = ["green", "blue", "rose", "gray"];
    const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return tones[sum % tones.length];
};

const getStatusDetails = (user) => {
    if (user.is_active === false) return { text: "Suspended", tone: "suspended" };
    if (user.status === "pending") return { text: "Pending Approval", tone: "pending" };
    if (user.status === "rejected") return { text: "Rejected", tone: "suspended" };
    return { text: "Active", tone: "active" };
};

/* ─── Empty Form ──────────────────────────────────────── */
const emptyForm = {
    name: "", email: "", password: "",
    company_name: "", contact_person: "", phone: "",
    category: "", gst_number: "", address: "", city: "", state: "",
};

/* ─── Vendor Row ──────────────────────────────────────── */
const VendorRow = ({ user, onEdit, onDelete, onToggleStatus }) => {
    const { text: statusText, tone: statusTone } = getStatusDetails(user);
    const vendor = user.Vendor;
    const initials = getInitials(vendor?.company_name || user.name);
    const avatarTone = getAvatarTone(user.id);
    const code = `VND-${user.id.slice(0, 4).toUpperCase()}`;

    return (
        <tr>
            <td><input type="checkbox" aria-label={`Select ${user.name}`} /></td>
            <td className="vb-code">{code}</td>
            <td className="vb-company">
                <div className="vb-contact">
                    <span className={`vb-avatar tone-${avatarTone}`}>{initials}</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>{vendor?.company_name || user.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{vendor?.category || "—"}</div>
                    </div>
                </div>
            </td>
            <td>{user.email}</td>
            <td>{vendor?.phone || "—"}</td>
            <td><span className="vb-code" style={{ fontSize: "11px" }}>{vendor?.gst_number || "—"}</span></td>
            <td>
                <span className={`vb-status tone-${statusTone}`}>
                    <span />
                    {statusText}
                </span>
            </td>
            <td>
                <div className="vb-row-actions">
                    {user.status === "pending" && (
                        <>
                            <button
                                aria-label={`Approve ${user.name}`}
                                title="Approve Vendor"
                                onClick={() => onToggleStatus(user.id, "approve")}
                            >
                                <Icon className="tone-text-primary">check_circle</Icon>
                            </button>
                            <button
                                aria-label={`Reject ${user.name}`}
                                title="Reject Vendor"
                                onClick={() => onToggleStatus(user.id, "reject")}
                            >
                                <Icon className="tone-text-danger">cancel</Icon>
                            </button>
                        </>
                    )}
                    {user.is_active === true && user.status !== "pending" && (
                        <button
                            aria-label={`Suspend ${user.name}`}
                            title="Suspend Vendor"
                            onClick={() => onToggleStatus(user.id, "block")}
                        >
                            <Icon className="tone-text-danger">block</Icon>
                        </button>
                    )}
                    {user.is_active === false && (
                        <button
                            aria-label={`Unblock ${user.name}`}
                            title="Unblock Vendor"
                            onClick={() => onToggleStatus(user.id, "unblock")}
                        >
                            <Icon className="tone-text-primary">check_circle</Icon>
                        </button>
                    )}
                    <button aria-label={`Edit ${user.name}`} title="Edit" onClick={() => onEdit(user)}>
                        <Icon>edit</Icon>
                    </button>
                    <button aria-label={`Delete ${user.name}`} title="Delete" onClick={() => onDelete(user.id)}>
                        <Icon className="tone-text-danger">delete</Icon>
                    </button>
                </div>
            </td>
        </tr>
    );
};

/* ─── Main Page ───────────────────────────────────────── */
const VendorManagementPage = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [page, setPage] = useState(1);

    const params = {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
    };

    const { data, isLoading, isError, error } = useVendors(params);
    const vendors = data?.users || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const createVendor = useCreateVendor();
    const updateVendor = useUpdateVendor();
    const deleteVendor = useDeleteVendor();
    const toggleStatus = useToggleVendorStatus();

    const openCreate = useCallback(() => {
        setEditTarget(null);
        setForm(emptyForm);
        setShowForm(true);
    }, []);

    const openEdit = useCallback((user) => {
        setEditTarget(user);
        setForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            company_name: user.Vendor?.company_name || "",
            contact_person: user.Vendor?.contact_person || "",
            phone: user.Vendor?.phone || "",
            category: user.Vendor?.category || "",
            gst_number: user.Vendor?.gst_number || "",
            address: user.Vendor?.address || "",
            city: user.Vendor?.city || "",
            state: user.Vendor?.state || "",
        });
        setShowForm(true);
    }, []);

    const closeForm = useCallback(() => {
        setShowForm(false);
        setEditTarget(null);
        setForm(emptyForm);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...form, role: "vendor" };
        if (editTarget) {
            updateVendor.mutate({ id: editTarget.id, data: payload }, { onSuccess: closeForm });
        } else {
            createVendor.mutate(payload, { onSuccess: closeForm });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
            deleteVendor.mutate(id);
        }
    };

    const handleToggle = (userId, action) => toggleStatus.mutate({ userId, action });

    const fieldChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const isSubmitting = createVendor.isPending || updateVendor.isPending;

    return (
        <VendorBridgeShell active="Vendors" onSearch={(e) => { setSearch(e.target.value); setPage(1); }} searchValue={search}>
            <div className="vb-breadcrumbs">
                <a href="#">Admin</a>
                <Icon>chevron_right</Icon>
                <span>Vendor Management</span>
            </div>

            <section className="vb-page-header">
                <div>
                    <h2>Vendor Management</h2>
                    <p>Manage vendor accounts, approvals, and profiles.</p>
                </div>
                <div className="vb-toolbar">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--vb-border-subtle)", fontSize: "13px", cursor: "pointer" }}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <ToolbarButton icon="add" primary onClick={openCreate}>Add Vendor</ToolbarButton>
                </div>
            </section>

            <section className="vb-table-card">
                <div className="vb-table-toolbar">
                    <span>
                        {isLoading ? "Loading…" : `Showing ${vendors.length} of ${total} vendors`}
                    </span>
                </div>

                {isError && (
                    <div style={{ padding: "16px", color: "var(--vb-danger)", textAlign: "center" }}>
                        ⚠ {error?.response?.data?.message || "Failed to load vendors"}
                    </div>
                )}

                <div className="vb-table-wrap">
                    <table className="vb-vendor-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all" /></th>
                                <th>Vendor ID</th>
                                <th>Company</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>GST No.</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                        <Icon style={{ fontSize: "32px" }}>autorenew</Icon><br />Loading…
                                    </td>
                                </tr>
                            ) : vendors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                        <Icon style={{ fontSize: "48px", display: "block", margin: "0 auto 8px" }}>factory</Icon>
                                        No vendors found.
                                        <button onClick={openCreate} style={{ display: "block", margin: "12px auto 0", color: "var(--vb-primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                            Add the first vendor
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((user) => (
                                    <VendorRow
                                        key={user.id}
                                        user={user}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggle}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <footer className="vb-pagination">
                    <div className="vb-pagination-controls">
                        <span>Page {page} of {totalPages}</span>
                    </div>
                    <div className="vb-pagination-controls">
                        <div className="vb-pages">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                                <Icon>chevron_left</Icon>
                            </button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                <Icon>chevron_right</Icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </section>

            {/* Create / Edit Form Drawer */}
            {showForm && (
                <div className="vb-drawer-overlay" onClick={closeForm}>
                    <aside className="vb-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="vb-drawer-header">
                            <h3>{editTarget ? "Edit Vendor" : "Add New Vendor"}</h3>
                            <button className="vb-icon-button" onClick={closeForm}><Icon>close</Icon></button>
                        </div>
                        <form className="vb-drawer-body" onSubmit={handleSubmit}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Account Info</p>

                            {[
                                { label: "Full Name *", key: "name", type: "text", required: true },
                                { label: "Email *", key: "email", type: "email", required: true },
                                { label: editTarget ? "New Password (leave blank to keep)" : "Password *", key: "password", type: "password", required: !editTarget },
                            ].map(({ label, key, type, required }) => (
                                <label key={key} className="vb-field">
                                    <span>{label}</span>
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={fieldChange(key)}
                                        required={required}
                                        className="vb-field-input"
                                    />
                                </label>
                            ))}

                            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 12px" }}>Company Profile</p>

                            {[
                                { label: "Company Name *", key: "company_name", type: "text", required: true },
                                { label: "Contact Person", key: "contact_person", type: "text" },
                                { label: "Phone", key: "phone", type: "tel" },
                                { label: "Category", key: "category", type: "text" },
                                { label: "GST Number", key: "gst_number", type: "text" },
                                { label: "Address", key: "address", type: "text" },
                                { label: "City", key: "city", type: "text" },
                                { label: "State", key: "state", type: "text" },
                            ].map(({ label, key, type, required }) => (
                                <label key={key} className="vb-field">
                                    <span>{label}</span>
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={fieldChange(key)}
                                        required={required}
                                        className="vb-field-input"
                                    />
                                </label>
                            ))}

                            <div className="vb-drawer-footer">
                                <button type="button" className="vb-secondary-button" onClick={closeForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="vb-save-button" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving…" : editTarget ? "Save Changes" : "Create Vendor"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}
        </VendorBridgeShell>
    );
};

export default VendorManagementPage;
