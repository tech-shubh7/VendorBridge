import { useState, useEffect, useCallback } from "react";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import useManagers from "@/features/managers/hooks/useManagers";
import {
    useCreateManager,
    useUpdateManager,
    useDeleteManager,
    useToggleManagerStatus,
} from "@/features/managers/hooks/useManagerMutations";

/* ─── Helpers ─────────────────────────────────────────────── */
const getInitials = (name) =>
    name ? name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "M";

const getAvatarTone = (id = "") => {
    const tones = ["green", "blue", "rose", "gray"];
    const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return tones[sum % tones.length];
};

const getStatusDetails = (user) => {
    if (user.is_active === false) return { text: "Suspended", tone: "suspended" };
    if (user.status === "pending")  return { text: "Pending Approval", tone: "pending" };
    if (user.status === "rejected") return { text: "Rejected", tone: "suspended" };
    return { text: "Active", tone: "active" };
};

/* ─── Row ──────────────────────────────────────────────────── */
const ManagerRow = ({ user, onEdit, onDelete, onToggleStatus }) => {
    const { text: statusText, tone: statusTone } = getStatusDetails(user);
    const initials = getInitials(user.name);
    const avatarTone = getAvatarTone(user.id);
    const code = `MGR-${user.id.slice(0, 4).toUpperCase()}`;

    return (
        <tr>
            <td><input type="checkbox" aria-label={`Select ${user.name}`} /></td>
            <td className="vb-code">{code}</td>
            <td className="vb-company">
                <div className="vb-contact">
                    <span className={`vb-avatar tone-${avatarTone}`}>{initials}</span>
                    {user.name}
                </div>
            </td>
            <td>{user.email}</td>
            <td>
                <span className={`vb-status tone-${statusTone}`}>
                    <span />
                    {statusText}
                </span>
            </td>
            <td>
                <div className="vb-row-actions">
                    {user.is_active === true ? (
                        <button
                            aria-label={`Suspend ${user.name}`}
                            title="Suspend Manager"
                            onClick={() => onToggleStatus(user.id, "block")}
                        >
                            <Icon className="tone-text-danger">block</Icon>
                        </button>
                    ) : (
                        <button
                            aria-label={`Activate ${user.name}`}
                            title="Activate Manager"
                            onClick={() => onToggleStatus(user.id, "unblock")}
                        >
                            <Icon className="tone-text-success">check_circle</Icon>
                        </button>
                    )}
                    <button aria-label={`Edit ${user.name}`} title="Edit" onClick={() => onEdit(user)}>
                        <Icon>edit</Icon>
                    </button>
                    <button aria-label={`Delete ${user.name}`} title="Delete" onClick={() => onDelete(user.id)}>
                        <Icon>delete</Icon>
                    </button>
                </div>
            </td>
        </tr>
    );
};

/* ─── Modal ────────────────────────────────────────────────── */
const ManagerModal = ({ isOpen, onClose, onSave, editingUser, isSaving }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
            name:     fd.get("name"),
            email:    fd.get("email"),
            password: fd.get("password") || undefined,
        };
        // Remove empty password on create if not supplied
        if (!data.password) {
            data.password = editingUser
                ? undefined
                : `Manager${Math.floor(1000 + Math.random() * 9000)}!A`;
        }
        onSave(data);
    };

    return (
        <div className="vb-modal-backdrop">
            <section className="vb-modal" aria-labelledby="mgr-modal-title" aria-modal="true" role="dialog">
                <header className="vb-modal-header">
                    <h3 id="mgr-modal-title">{editingUser ? "Edit Manager" : "Add New Manager"}</h3>
                    <button className="vb-icon-button" aria-label="Close modal" onClick={onClose} type="button">
                        <Icon>close</Icon>
                    </button>
                </header>

                <form className="vb-vendor-form" onSubmit={handleSubmit}>
                    <label className="is-wide">
                        <span>Full Name</span>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g. Sarah Jenkins"
                            defaultValue={editingUser?.name ?? ""}
                            required
                            minLength={2}
                        />
                    </label>

                    <label>
                        <span>Email Address</span>
                        <input
                            name="email"
                            type="email"
                            placeholder="sarah@company.com"
                            defaultValue={editingUser?.email ?? ""}
                            required
                        />
                    </label>

                    <label>
                        <span>{editingUser ? "New Password (optional)" : "Password (optional)"}</span>
                        <input
                            name="password"
                            type="password"
                            placeholder="Autogenerated if empty"
                            minLength={8}
                        />
                    </label>

                    <footer className="vb-modal-footer" style={{ gridColumn: "span 2", marginTop: "16px" }}>
                        <button className="vb-secondary-button" onClick={onClose} type="button" disabled={isSaving}>
                            Cancel
                        </button>
                        <button className="vb-save-button" type="submit" disabled={isSaving}>
                            {isSaving ? "Saving…" : "Save Manager"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
};

/* ─── Page ─────────────────────────────────────────────────── */
const ManagerManagementPage = () => {
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [editingUser, setEditingUser]   = useState(null);
    const [page, setPage]                 = useState(1);
    const [limit, setLimit]               = useState(10);
    const [searchQuery, setSearchQuery]   = useState("");
    const [debouncedSearch, setDebounced] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebounced(searchQuery); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const buildParams = useCallback(() => {
        const p = { page, limit, search: debouncedSearch };
        if (statusFilter === "Active")           { p.status = "approved"; p.is_active = true; }
        else if (statusFilter === "Suspended")   { p.is_active = false; }
        return p;
    }, [page, limit, debouncedSearch, statusFilter]);

    const { data, isLoading } = useManagers(buildParams());
    const managers     = data?.users    || [];
    const total        = data?.total    || 0;
    const totalPages   = data?.totalPages || 1;
    const startResult  = total === 0 ? 0 : (page - 1) * limit + 1;
    const endResult    = Math.min(total, page * limit);

    const createMutation       = useCreateManager();
    const updateMutation       = useUpdateManager();
    const deleteMutation       = useDeleteManager();
    const toggleStatusMutation = useToggleManagerStatus();
    const isSaving = createMutation.isPending || updateMutation.isPending;

    const handleOpenAdd  = () => { setEditingUser(null);  setIsModalOpen(true); };
    const handleOpenEdit = (u) => { setEditingUser(u);    setIsModalOpen(true); };

    const handleSave = async (payload) => {
        try {
            if (editingUser) {
                await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setIsModalOpen(false);
        } catch (_) { /* errors handled in hook */ }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this manager and their login account?")) return;
        try { await deleteMutation.mutateAsync(id); } catch (_) {}
    };

    const handleToggleStatus = async (userId, action) => {
        try { await toggleStatusMutation.mutateAsync({ userId, action }); } catch (_) {}
    };

    return (
        <VendorBridgeShell active="Managers">
            <div className="vb-breadcrumbs">
                <a href="#">Administration</a>
                <Icon>chevron_right</Icon>
                <span>Managers</span>
            </div>

            <section className="vb-page-header">
                <div>
                    <h2>Manager Management</h2>
                    <p>Manage and supervise application managers, review access rights, and approve accounts.</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="add" primary onClick={handleOpenAdd}>Add New Manager</ToolbarButton>
                </div>
            </section>

            <div className="vb-filters">
                <label className="vb-search" style={{ border: "1px solid var(--vb-border-strong)", borderRadius: "4px", background: "white" }}>
                    <Icon>search</Icon>
                    <input
                        placeholder="Search managers by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: "transparent" }}
                    />
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "16px" }}>
                    <span>Filter by Status:</span>
                    {["All", "Active", "Suspended"].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                background: statusFilter === s ? "var(--vb-primary)" : "var(--vb-surface-variant)",
                                color:      statusFilter === s ? "var(--vb-on-primary)" : "var(--vb-text-main)",
                                padding: "4px 12px", borderRadius: "999px", cursor: "pointer", border: "none",
                            }}
                        >{s}</button>
                    ))}
                </div>
            </div>

            <section className="vb-table-card">
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all managers" /></th>
                                <th>Manager Code</th>
                                <th>Name</th>
                                <th>Email Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "48px 0", color: "var(--vb-text-muted)" }}>
                                        Loading managers…
                                    </td>
                                </tr>
                            ) : managers.length > 0 ? (
                                managers.map((u) => (
                                    <ManagerRow
                                        key={u.id}
                                        user={u}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "48px 0", color: "var(--vb-text-muted)" }}>
                                        No managers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <p>
                        Showing <strong>{startResult}</strong> to <strong>{endResult}</strong> of <strong>{total}</strong> results
                    </p>
                    <div className="vb-pagination-controls">
                        <span>Rows per page:</span>
                        <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="vb-pages">
                            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                <Icon>chevron_left</Icon>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={page === p ? "is-current" : ""} onClick={() => setPage(p)}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                <Icon>chevron_right</Icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </section>

            <ManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingUser={editingUser}
                isSaving={isSaving}
            />
        </VendorBridgeShell>
    );
};

export default ManagerManagementPage;
