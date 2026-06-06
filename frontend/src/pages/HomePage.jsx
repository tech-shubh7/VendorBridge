import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import useVendors from "@/features/vendors/hooks/useVendors";
import toast from "react-hot-toast";
import {
    useCreateVendor,
    useUpdateVendor,
    useDeleteVendor,
    useToggleVendorStatus
} from "@/features/vendors/hooks/useVendorMutations";

const Rating = ({ value }) => {
    if (!value) {
        return <span className="vb-no-rating">No ratings yet</span>;
    }

    return (
        <div className="vb-rating" aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Icon filled className={star <= value ? "" : "is-muted"} key={star}>
                    star
                </Icon>
            ))}
        </div>
    );
};

const getStatusDetails = (user) => {
    if (user.is_active === false) {
        return { text: "Suspended", tone: "suspended" };
    }
    if (user.status === "pending") {
        return { text: "Pending Approval", tone: "pending" };
    }
    if (user.status === "rejected") {
        return { text: "Rejected", tone: "suspended" };
    }
    return { text: "Active", tone: "active" };
};

const getInitials = (name) => {
    if (!name) return "V";
    return name.trim().split(/\s+/).map(part => part[0]).join("").toUpperCase().slice(0, 2);
};

const getAvatarTone = (id) => {
    if (!id) return "blue";
    const tones = ["green", "blue", "rose", "gray"];
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tones[charCodeSum % tones.length];
};

const VendorRow = ({ user, onView, onEdit, onDelete, onToggleStatus }) => {
    const statusDetails = getStatusDetails(user);
    const vendorProfile = user.Vendor || {};
    const initials = getInitials(vendorProfile.contact_person || user.name);
    const avatarTone = getAvatarTone(user.id);

    return (
        <tr>
            <td>
                <input type="checkbox" aria-label={`Select ${vendorProfile.company_name || user.name}`} />
            </td>
            <td className="vb-code">VND-{user.id.slice(0, 4).toUpperCase()}</td>
            <td className="vb-company">{vendorProfile.company_name || "N/A"}</td>
            <td>{vendorProfile.category || "N/A"}</td>
            <td className="vb-code">{vendorProfile.gst_number || "N/A"}</td>
            <td>
                <div className="vb-contact">
                    <span className={`vb-avatar tone-${avatarTone}`}>{initials}</span>
                    {vendorProfile.contact_person || user.name}
                </div>
            </td>
            <td>
                <span className={`vb-status tone-${statusDetails.tone}`}>
                    <span />
                    {statusDetails.text}
                </span>
            </td>
            <td>
                <Rating value={vendorProfile.rating} />
            </td>
            <td>
                <div className="vb-row-actions">
                    {user.status === "pending" && (
                        <>
                            <button 
                                aria-label={`Approve ${vendorProfile.company_name || user.name}`} 
                                title="Approve Vendor"
                                onClick={() => onToggleStatus(user.id, "approve")}
                            >
                                <Icon className="tone-text-success">check_circle</Icon>
                            </button>
                            <button 
                                aria-label={`Reject ${vendorProfile.company_name || user.name}`} 
                                title="Reject Vendor"
                                onClick={() => onToggleStatus(user.id, "reject")}
                            >
                                <Icon className="tone-text-danger">cancel</Icon>
                            </button>
                        </>
                    )}
                    {user.status === "approved" && user.is_active === true && (
                        <button 
                            aria-label={`Suspend ${vendorProfile.company_name || user.name}`} 
                            title="Suspend Vendor"
                            onClick={() => onToggleStatus(user.id, "block")}
                        >
                            <Icon className="tone-text-danger">block</Icon>
                        </button>
                    )}
                    {(user.status === "rejected" || user.is_active === false) && (
                        <button 
                            aria-label={`Activate ${vendorProfile.company_name || user.name}`} 
                            title="Activate Vendor"
                            onClick={() => onToggleStatus(user.id, "unblock")}
                        >
                            <Icon className="tone-text-success">check_circle</Icon>
                        </button>
                    )}
                    <button aria-label={`View ${vendorProfile.company_name || user.name}`} title="View Details" onClick={() => onView(user)}>
                        <Icon>visibility</Icon>
                    </button>
                    <button aria-label={`Edit ${vendorProfile.company_name || user.name}`} title="Edit" onClick={() => onEdit(user)}>
                        <Icon>edit</Icon>
                    </button>
                    <button aria-label={`Delete ${vendorProfile.company_name || user.name}`} title="Delete" onClick={() => onDelete(user.id)}>
                        <Icon>delete</Icon>
                    </button>
                </div>
            </td>
        </tr>
    );
};

const AddVendorModal = ({ isOpen, onClose, onSave, editingUser }) => {
    if (!isOpen) return null;

    const vendorProfile = editingUser?.Vendor || {};

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            company_name: formData.get("company_name"),
            contact_person: formData.get("contact_person"),
            name: formData.get("contact_person"), // required base user name field
            email: formData.get("email"),
            phone: formData.get("phone") || "",
            category: formData.get("category"),
            gst_number: formData.get("gst_number") || "",
            address: formData.get("address") || "",
            city: formData.get("city") || "",
            state: formData.get("state") || "",
            notes: formData.get("notes") || "",
        };

        if (!editingUser) {
            data.password = formData.get("password") || `VendorBridge${Math.floor(1000 + Math.random() * 9000)}!`;
        }

        onSave(data);
    };

    return (
        <div className="vb-modal-backdrop">
            <section className="vb-modal" aria-labelledby="add-vendor-title" aria-modal="true" role="dialog">
                <header className="vb-modal-header">
                    <h3 id="add-vendor-title">{editingUser ? "Edit Vendor" : "Add New Vendor"}</h3>
                    <button className="vb-icon-button" aria-label="Close modal" onClick={onClose} type="button">
                        <Icon>close</Icon>
                    </button>
                </header>

                <form className="vb-vendor-form" onSubmit={handleSubmit}>
                    <label className="is-wide">
                        <span>Company Name</span>
                        <input
                            name="company_name"
                            type="text"
                            placeholder="e.g. Acme Corp"
                            defaultValue={editingUser ? vendorProfile.company_name : ""}
                            required
                            minLength={2}
                        />
                    </label>

                    <label>
                        <span>Contact Person Name</span>
                        <input
                            name="contact_person"
                            type="text"
                            placeholder="Full Name"
                            defaultValue={editingUser ? vendorProfile.contact_person : ""}
                            required
                            minLength={2}
                        />
                    </label>

                    <label>
                        <span>Email Address</span>
                        <input
                            name="email"
                            type="email"
                            placeholder="contact@company.com"
                            defaultValue={editingUser ? editingUser.email : ""}
                            required
                        />
                    </label>

                    {!editingUser && (
                        <label>
                            <span>Password (Optional)</span>
                            <input
                                name="password"
                                type="password"
                                placeholder="Autogenerated if empty"
                                minLength={8}
                            />
                        </label>
                    )}

                    <label className={editingUser ? "is-wide" : ""}>
                        <span>Category</span>
                        <select name="category" defaultValue={editingUser ? vendorProfile.category : "IT Hardware"}>
                            {["IT Hardware", "Logistics", "Office Supplies", "Raw Materials", "Services"].map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Phone Number</span>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            defaultValue={editingUser ? vendorProfile.phone : ""}
                            pattern="^\+?[\d\s\-().]{7,20}$"
                            title="7 to 20 digits"
                        />
                    </label>

                    <label>
                        <span>GST/PAN Number</span>
                        <input
                            name="gst_number"
                            type="text"
                            placeholder="e.g. 29AABCD1234E1Z5"
                            defaultValue={editingUser ? vendorProfile.gst_number : ""}
                            pattern="^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$"
                            title="15-character GSTIN format"
                            style={{ textTransform: "uppercase" }}
                        />
                    </label>

                    <label className="is-wide">
                        <span>Address</span>
                        <textarea
                            name="address"
                            placeholder="Full business address"
                            rows="3"
                            defaultValue={editingUser ? vendorProfile.address : ""}
                        />
                    </label>

                    <label>
                        <span>City</span>
                        <input
                            name="city"
                            type="text"
                            placeholder="City"
                            defaultValue={editingUser ? vendorProfile.city : ""}
                        />
                    </label>

                    <label>
                        <span>State</span>
                        <input
                            name="state"
                            type="text"
                            placeholder="State"
                            defaultValue={editingUser ? vendorProfile.state : ""}
                        />
                    </label>

                    <label className="is-wide">
                        <span>Notes</span>
                        <textarea
                            name="notes"
                            placeholder="Primary services, products, or terms..."
                            rows="2"
                            defaultValue={editingUser ? vendorProfile.notes : ""}
                        />
                    </label>

                    <footer className="vb-modal-footer" style={{ gridColumn: "span 2", marginTop: "16px" }}>
                        <button className="vb-secondary-button" onClick={onClose} type="button">Cancel</button>
                        <button className="vb-save-button" type="submit">Save Vendor</button>
                    </footer>
                </form>
            </section>
        </div>
    );
};

const ViewVendorModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;

    const vendorProfile = user.Vendor || {};

    return (
        <div className="vb-modal-backdrop">
            <section className="vb-modal" aria-labelledby="view-vendor-title" aria-modal="true" role="dialog" style={{ maxWidth: "550px" }}>
                <header className="vb-modal-header">
                    <h3 id="view-vendor-title">Vendor Details</h3>
                    <button className="vb-icon-button" aria-label="Close modal" onClick={onClose} type="button">
                        <Icon>close</Icon>
                    </button>
                </header>

                <div className="vb-vendor-form" style={{ padding: "12px 0" }}>
                    <div style={{ gridColumn: "span 2", display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
                        <span className={`vb-avatar tone-blue`} style={{ width: "48px", height: "48px", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: "600" }}>
                            {vendorProfile.company_name ? vendorProfile.company_name.slice(0, 2).toUpperCase() : "V"}
                        </span>
                        <div>
                            <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>{vendorProfile.company_name || user.name}</h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--vb-text-muted)" }}>Code: VND-{user.id.slice(0, 4).toUpperCase()}</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Contact Person</span>
                        <span style={{ fontSize: "14px" }}>{vendorProfile.contact_person || user.name}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Email Address</span>
                        <span style={{ fontSize: "14px" }}>{user.email}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Phone Number</span>
                        <span style={{ fontSize: "14px" }}>{vendorProfile.phone || "N/A"}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Category</span>
                        <span style={{ fontSize: "14px" }}>{vendorProfile.category || "N/A"}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>GST/PAN Number</span>
                        <span style={{ fontSize: "14px" }}>{vendorProfile.gst_number || "N/A"}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Rating</span>
                        <Rating value={vendorProfile.rating} />
                    </div>

                    <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Address</span>
                        <span style={{ fontSize: "14px" }}>{vendorProfile.address ? `${vendorProfile.address}${vendorProfile.city ? `, ${vendorProfile.city}` : ""}${vendorProfile.state ? `, ${vendorProfile.state}` : ""}` : "N/A"}</span>
                    </div>

                    <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Notes</span>
                        <span style={{ fontSize: "14px", whiteSpace: "pre-line" }}>{vendorProfile.notes || "No additional notes."}</span>
                    </div>
                </div>

                <footer className="vb-modal-footer">
                    <button className="vb-secondary-button" onClick={onClose} type="button">Close</button>
                </footer>
            </section>
        </div>
    );
};

const HomePage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [searchParams, setSearchParams] = useSearchParams();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset page to 1 on filter/search change
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Map UI filters to backend User parameters
    const getBackendParams = () => {
        const params = {
            page,
            limit,
            search: debouncedSearch,
        };

        if (statusFilter === "Active") {
            params.status = "approved";
            params.is_active = true;
        } else if (statusFilter === "Pending Approval") {
            params.status = "pending";
        } else if (statusFilter === "Suspended") {
            params.is_active = false;
        }

        return params;
    };

    // Query
    const { data, isLoading } = useVendors(getBackendParams());

    // Mutations
    const createMutation = useCreateVendor();
    const updateMutation = useUpdateVendor();
    const deleteMutation = useDeleteVendor();
    const toggleStatusMutation = useToggleVendorStatus();

    useEffect(() => {
        if (searchParams.get("addVendor") === "true") {
            handleOpenAdd();
            searchParams.delete("addVendor");
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    const handleOpenAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleOpenView = (user) => {
        setViewingUser(user);
        setIsViewModalOpen(true);
    };

    const handleSave = async (payload) => {
        try {
            if (editingUser) {
                await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    const handleToggleStatus = async (userId, action) => {
        if (!userId) {
            toast.error("User account not linked to this vendor profile.");
            return;
        }
        try {
            await toggleStatusMutation.mutateAsync({ userId, action });
        } catch (error) {
            console.error("Status toggle failed:", error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this vendor and their login account?")) {
            try {
                await deleteMutation.mutateAsync(id);
            } catch (error) {
                console.error("Delete failed:", error);
            }
        }
    };

    const vendors = data?.users || [];
    const totalVendors = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const startResult = totalVendors === 0 ? 0 : (page - 1) * limit + 1;
    const endResult = Math.min(totalVendors, page * limit);

    return (
        <VendorBridgeShell active="Vendors">
            <div className="vb-breadcrumbs">
                <a href="#">Administration</a>
                <Icon>chevron_right</Icon>
                <span>Vendors</span>
            </div>

            <section className="vb-page-header">
                <div>
                    <h2>Vendor Management</h2>
                    <p>Manage your active suppliers, evaluate performance, and onboard new vendors.</p>
                </div>
                <div className="vb-toolbar">
                    <ToolbarButton icon="add" primary onClick={handleOpenAdd}>Add New Vendor</ToolbarButton>
                </div>
            </section>

            <div className="vb-filters">
                <label className="vb-search" style={{ border: "1px solid var(--vb-border-strong)", borderRadius: "4px", background: "white" }}>
                    <Icon>search</Icon>
                    <input 
                        placeholder="Search vendors by company, contact person or email..." 
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
                            onClick={() => { setStatusFilter(status); setPage(1); }}
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
                </div>
            </div>

            {/* Active Filters Summary */}
            {(debouncedSearch || statusFilter !== "All") && (
                <div className="vb-filters" style={{ marginTop: "-8px", paddingTop: 0 }}>
                    <span style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>Active Filters:</span>
                    {debouncedSearch && (
                        <button 
                            style={{ padding: "2px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                            onClick={() => setSearchQuery("")}
                        >
                            Search: &quot;{debouncedSearch}&quot; <Icon style={{ fontSize: "14px" }}>close</Icon>
                        </button>
                    )}
                    {statusFilter !== "All" && (
                        <button 
                            style={{ padding: "2px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                            onClick={() => setStatusFilter("All")}
                        >
                            Status: {statusFilter} <Icon style={{ fontSize: "14px" }}>close</Icon>
                        </button>
                    )}
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setSearchQuery(""); setStatusFilter("All"); }}
                        style={{ fontSize: "12px", marginLeft: "8px" }}
                    >
                        Clear All
                    </a>
                </div>
            )}

            <section className="vb-table-card">
                <div className="vb-table-wrap">
                    <table className="vb-vendor-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" aria-label="Select all vendors" /></th>
                                <th>Vendor Code</th>
                                <th>Company Name</th>
                                <th>Category</th>
                                <th>GST/PAN</th>
                                <th>Contact Person</th>
                                <th>Status</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "48px 0" }}>
                                        <div style={{ color: "var(--vb-text-muted)" }}>Loading vendors...</div>
                                    </td>
                                </tr>
                            ) : vendors.length > 0 ? (
                                vendors.map((vendorUser) => (
                                    <VendorRow 
                                        user={vendorUser} 
                                        key={vendorUser.id} 
                                        onView={handleOpenView}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "48px 0", color: "var(--vb-text-muted)" }}>
                                        No vendors found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <footer className="vb-pagination">
                    <p>
                        Showing <strong>{startResult}</strong> to <strong>{endResult}</strong> of <strong>{totalVendors}</strong> results
                    </p>
                    <div className="vb-pagination-controls">
                        <span>Rows per page:</span>
                        <select 
                            value={limit} 
                            onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="vb-pages">
                            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <Icon>chevron_left</Icon>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button 
                                    key={p} 
                                    className={page === p ? "is-current" : ""}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <Icon>chevron_right</Icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </section>

            <AddVendorModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                editingUser={editingUser}
            />

            <ViewVendorModal
                user={viewingUser}
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
            />
        </VendorBridgeShell>
    );
};

export default HomePage;


