import { useState } from "react";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";

const initialManagers = [
    {
        code: "MGR-1021",
        name: "Sarah Jenkins",
        email: "sarah.jenkins@vendorbridge.com",
        initials: "SJ",
        avatarTone: "green",
        status: "Active",
        statusTone: "active",
    },
    {
        code: "MGR-1044",
        name: "Michael Ross",
        email: "michael.ross@vendorbridge.com",
        initials: "MR",
        avatarTone: "blue",
        status: "Pending Approval",
        statusTone: "pending",
    },
    {
        code: "MGR-1012",
        name: "Priya Patel",
        email: "priya.patel@vendorbridge.com",
        initials: "PP",
        avatarTone: "gray",
        status: "Suspended",
        statusTone: "suspended",
    },
    {
        code: "MGR-1105",
        name: "David Lee",
        email: "david.lee@vendorbridge.com",
        initials: "DL",
        avatarTone: "rose",
        status: "Active",
        statusTone: "active",
    },
];

const formFields = [
    { label: "Full Name", name: "name", placeholder: "e.g. Sarah Jenkins", wide: true },
    { label: "Email Address", name: "email", type: "email", placeholder: "sarah@company.com" },
    { label: "Status", name: "status", type: "select", options: ["Active", "Pending Approval", "Suspended"] },
];

const ManagerRow = ({ manager, onToggleStatus, onEdit, onDelete }) => (
    <tr>
        <td>
            <input type="checkbox" aria-label={`Select ${manager.name}`} />
        </td>
        <td className="vb-code">{manager.code}</td>
        <td className="vb-company">
            <div className="vb-contact">
                <span className={`vb-avatar tone-${manager.avatarTone}`}>{manager.initials}</span>
                {manager.name}
            </div>
        </td>
        <td>{manager.email}</td>
        <td>
            <span className={`vb-status tone-${manager.statusTone}`}>
                <span />
                {manager.status}
            </span>
        </td>
        <td>
            <div className="vb-row-actions">
                {manager.status === "Pending Approval" ? (
                    <button 
                        aria-label={`Approve ${manager.name}`} 
                        title="Approve Manager"
                        onClick={() => onToggleStatus(manager.code, "Active")}
                    >
                        <Icon className="tone-text-success">check_circle</Icon>
                    </button>
                ) : manager.status === "Active" ? (
                    <button 
                        aria-label={`Block ${manager.name}`} 
                        title="Suspend Manager"
                        onClick={() => onToggleStatus(manager.code, "Suspended")}
                    >
                        <Icon className="tone-text-danger">block</Icon>
                    </button>
                ) : (
                    <button 
                        aria-label={`Activate ${manager.name}`} 
                        title="Activate Manager"
                        onClick={() => onToggleStatus(manager.code, "Active")}
                    >
                        <Icon className="tone-text-success">check_circle</Icon>
                    </button>
                )}
                <button aria-label={`Edit ${manager.name}`} onClick={() => onEdit(manager)}>
                    <Icon>edit</Icon>
                </button>
                <button aria-label={`Delete ${manager.name}`} onClick={() => onDelete(manager.code)}>
                    <Icon>delete</Icon>
                </button>
            </div>
        </td>
    </tr>
);

const AddManagerModal = ({ isOpen, onClose, onSave, editingManager }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name");
        const email = formData.get("email");
        const status = formData.get("status");
        onSave({ name, email, status });
    };

    return (
        <div className="vb-modal-backdrop">
            <section className="vb-modal" aria-labelledby="add-manager-title" aria-modal="true" role="dialog">
                <header className="vb-modal-header">
                    <h3 id="add-manager-title">{editingManager ? "Edit Manager" : "Add New Manager"}</h3>
                    <button className="vb-icon-button" aria-label="Close modal" onClick={onClose} type="button">
                        <Icon>close</Icon>
                    </button>
                </header>

                <form className="vb-vendor-form" onSubmit={handleSubmit}>
                    {formFields.map((field) => (
                        <label className={field.wide ? "is-wide" : ""} key={field.label}>
                            <span>{field.label}</span>
                            {field.type === "select" ? (
                                <select name={field.name} defaultValue={editingManager ? editingManager.status : field.options[0]}>
                                    {field.options.map((option) => (
                                        <option key={option}>{option}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    name={field.name}
                                    type={field.type || "text"} 
                                    placeholder={field.placeholder} 
                                    defaultValue={editingManager ? editingManager[field.name] : ""}
                                    required
                                />
                            )}
                        </label>
                    ))}
                    
                    <footer className="vb-modal-footer" style={{ gridColumn: "span 2", marginTop: "16px" }}>
                        <button className="vb-secondary-button" onClick={onClose} type="button">Cancel</button>
                        <button className="vb-save-button" type="submit">Save Manager</button>
                    </footer>
                </form>
            </section>
        </div>
    );
};

const ManagerManagementPage = () => {
    const [managers, setManagers] = useState(initialManagers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const handleOpenAdd = () => {
        setEditingManager(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (manager) => {
        setEditingManager(manager);
        setIsModalOpen(true);
    };

    const handleSave = (data) => {
        if (editingManager) {
            // Edit existing
            setManagers(prev => prev.map(m => m.code === editingManager.code ? {
                ...m,
                name: data.name,
                email: data.email,
                status: data.status,
                statusTone: data.status === "Active" ? "active" : data.status === "Suspended" ? "suspended" : "pending"
            } : m));
        } else {
            // Add new
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const initials = data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const tones = ["green", "blue", "rose", "gray"];
            const avatarTone = tones[Math.floor(Math.random() * tones.length)];
            const newManager = {
                code: `MGR-${randomId}`,
                name: data.name,
                email: data.email,
                initials: initials || "M",
                avatarTone,
                status: data.status,
                statusTone: data.status === "Active" ? "active" : data.status === "Suspended" ? "suspended" : "pending"
            };
            setManagers(prev => [...prev, newManager]);
        }
        setIsModalOpen(false);
    };

    const handleToggleStatus = (code, newStatus) => {
        setManagers(prev => prev.map(m => m.code === code ? {
            ...m,
            status: newStatus,
            statusTone: newStatus === "Active" ? "active" : newStatus === "Suspended" ? "suspended" : "pending"
        } : m));
    };

    const handleDelete = (code) => {
        if (confirm("Are you sure you want to delete this manager?")) {
            setManagers(prev => prev.filter(m => m.code !== code));
        }
    };

    // Filtered list
    const filteredManagers = managers.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              m.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                        placeholder="Search managers by name, email or code..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: "transparent" }}
                    />
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "16px" }}>
                    <span>Filter by Status:</span>
                    {["All", "Active", "Pending Approval", "Suspended"].map((status) => (
                        <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status ? "is-active" : ""}
                            style={{
                                background: statusFilter === status ? "var(--vb-primary)" : "var(--vb-surface-variant)",
                                color: statusFilter === status ? "var(--vb-on-primary)" : "var(--vb-text-main)",
                                padding: "4px 12px",
                                borderRadius: "999px",
                                cursor: "pointer",
                                border: "none"
                            }}
                        >
                            {status}
                        </button>
                    ))}
                    {statusFilter !== "All" && (
                        <a href="#" onClick={(e) => { e.preventDefault(); setStatusFilter("All"); }} style={{ marginLeft: "8px" }}>Clear</a>
                    )}
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
                            {filteredManagers.length > 0 ? (
                                filteredManagers.map((manager) => (
                                    <ManagerRow 
                                        manager={manager} 
                                        key={manager.code} 
                                        onToggleStatus={handleToggleStatus}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "32px 0", color: "var(--vb-text-muted)" }}>
                                        No managers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <p>
                        Showing <strong>1</strong> to <strong>{filteredManagers.length}</strong> of <strong>{filteredManagers.length}</strong> results
                    </p>
                    <div className="vb-pagination-controls">
                        <span>Rows per page:</span>
                        <select defaultValue="10">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <div className="vb-pages">
                            <button disabled><Icon>chevron_left</Icon></button>
                            <button className="is-current">1</button>
                            <button disabled><Icon>chevron_right</Icon></button>
                        </div>
                    </div>
                </footer>
            </section>

            <AddManagerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                editingManager={editingManager}
            />
        </VendorBridgeShell>
    );
};

export default ManagerManagementPage;
