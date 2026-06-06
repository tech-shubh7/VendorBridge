import { useState } from "react";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";

const initialOfficers = [
    {
        code: "POF-2011",
        name: "Ravi Patel",
        email: "ravi.patel@vendorbridge.com",
        initials: "RP",
        avatarTone: "green",
        status: "Active",
        statusTone: "active",
    },
    {
        code: "POF-2022",
        name: "Jane Doe",
        email: "jane.doe@vendorbridge.com",
        initials: "JD",
        avatarTone: "blue",
        status: "Pending Approval",
        statusTone: "pending",
    },
    {
        code: "POF-2033",
        name: "Alice Johnson",
        email: "alice.johnson@vendorbridge.com",
        initials: "AJ",
        avatarTone: "rose",
        status: "Suspended",
        statusTone: "suspended",
    },
    {
        code: "POF-2044",
        name: "Bob Smith",
        email: "bob.smith@vendorbridge.com",
        initials: "BS",
        avatarTone: "gray",
        status: "Active",
        statusTone: "active",
    },
];

const formFields = [
    { label: "Full Name", name: "name", placeholder: "e.g. Ravi Patel", wide: true },
    { label: "Email Address", name: "email", type: "email", placeholder: "ravi@company.com" },
    { label: "Status", name: "status", type: "select", options: ["Active", "Pending Approval", "Suspended"] },
];

const OfficerRow = ({ officer, onToggleStatus, onEdit, onDelete }) => (
    <tr>
        <td>
            <input type="checkbox" aria-label={`Select ${officer.name}`} />
        </td>
        <td className="vb-code">{officer.code}</td>
        <td className="vb-company">
            <div className="vb-contact">
                <span className={`vb-avatar tone-${officer.avatarTone}`}>{officer.initials}</span>
                {officer.name}
            </div>
        </td>
        <td>{officer.email}</td>
        <td>
            <span className={`vb-status tone-${officer.statusTone}`}>
                <span />
                {officer.status}
            </span>
        </td>
        <td>
            <div className="vb-row-actions">
                {officer.status === "Pending Approval" ? (
                    <button 
                        aria-label={`Approve ${officer.name}`} 
                        title="Approve Officer"
                        onClick={() => onToggleStatus(officer.code, "Active")}
                    >
                        <Icon className="tone-text-success">check_circle</Icon>
                    </button>
                ) : officer.status === "Active" ? (
                    <button 
                        aria-label={`Block ${officer.name}`} 
                        title="Suspend Officer"
                        onClick={() => onToggleStatus(officer.code, "Suspended")}
                    >
                        <Icon className="tone-text-danger">block</Icon>
                    </button>
                ) : (
                    <button 
                        aria-label={`Activate ${officer.name}`} 
                        title="Activate Officer"
                        onClick={() => onToggleStatus(officer.code, "Active")}
                    >
                        <Icon className="tone-text-success">check_circle</Icon>
                    </button>
                )}
                <button aria-label={`Edit ${officer.name}`} onClick={() => onEdit(officer)}>
                    <Icon>edit</Icon>
                </button>
                <button aria-label={`Delete ${officer.name}`} onClick={() => onDelete(officer.code)}>
                    <Icon>delete</Icon>
                </button>
            </div>
        </td>
    </tr>
);

const AddOfficerModal = ({ isOpen, onClose, onSave, editingOfficer }) => {
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
            <section className="vb-modal" aria-labelledby="add-officer-title" aria-modal="true" role="dialog">
                <header className="vb-modal-header">
                    <h3 id="add-officer-title">{editingOfficer ? "Edit Procurement Officer" : "Add New Procurement Officer"}</h3>
                    <button className="vb-icon-button" aria-label="Close modal" onClick={onClose} type="button">
                        <Icon>close</Icon>
                    </button>
                </header>

                <form className="vb-vendor-form" onSubmit={handleSubmit}>
                    {formFields.map((field) => (
                        <label className={field.wide ? "is-wide" : ""} key={field.label}>
                            <span>{field.label}</span>
                            {field.type === "select" ? (
                                <select name={field.name} defaultValue={editingOfficer ? editingOfficer.status : field.options[0]}>
                                    {field.options.map((option) => (
                                        <option key={option}>{option}</option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    name={field.name}
                                    type={field.type || "text"} 
                                    placeholder={field.placeholder} 
                                    defaultValue={editingOfficer ? editingOfficer[field.name] : ""}
                                    required
                                />
                            )}
                        </label>
                    ))}
                    
                    <footer className="vb-modal-footer" style={{ gridColumn: "span 2", marginTop: "16px" }}>
                        <button className="vb-secondary-button" onClick={onClose} type="button">Cancel</button>
                        <button className="vb-save-button" type="submit">Save Officer</button>
                    </footer>
                </form>
            </section>
        </div>
    );
};

const ProcurementOfficerManagementPage = () => {
    const [officers, setOfficers] = useState(initialOfficers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOfficer, setEditingOfficer] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const handleOpenAdd = () => {
        setEditingOfficer(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (officer) => {
        setEditingOfficer(officer);
        setIsModalOpen(true);
    };

    const handleSave = (data) => {
        if (editingOfficer) {
            // Edit existing
            setOfficers(prev => prev.map(o => o.code === editingOfficer.code ? {
                ...o,
                name: data.name,
                email: data.email,
                status: data.status,
                statusTone: data.status === "Active" ? "active" : data.status === "Suspended" ? "suspended" : "pending"
            } : o));
        } else {
            // Add new
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const initials = data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const tones = ["green", "blue", "rose", "gray"];
            const avatarTone = tones[Math.floor(Math.random() * tones.length)];
            const newOfficer = {
                code: `POF-${randomId}`,
                name: data.name,
                email: data.email,
                initials: initials || "P",
                avatarTone,
                status: data.status,
                statusTone: data.status === "Active" ? "active" : data.status === "Suspended" ? "suspended" : "pending"
            };
            setOfficers(prev => [...prev, newOfficer]);
        }
        setIsModalOpen(false);
    };

    const handleToggleStatus = (code, newStatus) => {
        setOfficers(prev => prev.map(o => o.code === code ? {
            ...o,
            status: newStatus,
            statusTone: newStatus === "Active" ? "active" : newStatus === "Suspended" ? "suspended" : "pending"
        } : o));
    };

    const handleDelete = (code) => {
        if (confirm("Are you sure you want to delete this procurement officer?")) {
            setOfficers(prev => prev.filter(o => o.code !== code));
        }
    };

    // Filtered list
    const filteredOfficers = officers.filter(o => {
        const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              o.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <VendorBridgeShell active="Officers">
            <div className="vb-breadcrumbs">
                <a href="#">Administration</a>
                <Icon>chevron_right</Icon>
                <span>Procurement Officers</span>
            </div>

            <section className="vb-page-header">
                <div>
                    <h2>Procurement Officer Management</h2>
                    <p>Manage and track procurement officers, handle registration approval and system status.</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="add" primary onClick={handleOpenAdd}>Add New Officer</ToolbarButton>
                </div>
            </section>

            <div className="vb-filters">
                <label className="vb-search" style={{ border: "1px solid var(--vb-border-strong)", borderRadius: "4px", background: "white" }}>
                    <Icon>search</Icon>
                    <input 
                        placeholder="Search officers by name, email or code..." 
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
                                <th><input type="checkbox" aria-label="Select all officers" /></th>
                                <th>Officer Code</th>
                                <th>Name</th>
                                <th>Email Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOfficers.length > 0 ? (
                                filteredOfficers.map((officer) => (
                                    <OfficerRow 
                                        officer={officer} 
                                        key={officer.code} 
                                        onToggleStatus={handleToggleStatus}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "32px 0", color: "var(--vb-text-muted)" }}>
                                        No officers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <p>
                        Showing <strong>1</strong> to <strong>{filteredOfficers.length}</strong> of <strong>{filteredOfficers.length}</strong> results
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

            <AddOfficerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                editingOfficer={editingOfficer}
            />
        </VendorBridgeShell>
    );
};

export default ProcurementOfficerManagementPage;
