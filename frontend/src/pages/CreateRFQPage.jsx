import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRFQStore } from "@/store/rfqStore";
import { vendorApi } from "@/api/endpoints/vendorApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";

const steps = ["RFQ Info", "Line Items", "Vendors", "Review", "Publish"];

const CreateRFQPage = () => {
    const navigate = useNavigate();
    const { createRFQ, publishRFQ, isCreating, isPublishing } = useRFQStore();
    const [currentStep, setCurrentStep] = useState(0);

    // ── Step 0: RFQ Info ───────────────────────────────────────────────────────
    // Fields mapped directly to API body: title, description, deadline
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [description, setDescription] = useState("");

    // ── Step 1: Line Items ─────────────────────────────────────────────────────
    // item_name, quantity, unit, specifications (matching API payload)
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({
        item_name: "",
        quantity: 1,
        unit: "",
        specifications: "",
    });

    // ── Step 2: Vendors ────────────────────────────────────────────────────────
    // vendor_ids are real UUIDs fetched from backend
    const [vendorList, setVendorList] = useState([]);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    const [selectedVendorIds, setSelectedVendorIds] = useState([]);

    // ── Created RFQ (after submit) ─────────────────────────────────────────────
    const [createdRFQ, setCreatedRFQ] = useState(null);

    // Fetch vendors when step 2 is reached
    useEffect(() => {
        if (currentStep === 2) {
            setVendorsLoading(true);
            vendorApi
                .getAll({ limit: 100, role: "vendor" })
                .then((res) => {
                    const rawData = res.data?.data ?? res.data;
                    const list = Array.isArray(rawData)
                        ? rawData
                        : (rawData?.users || []);
                    setVendorList(list);
                })
                .catch(() => toast.error("Failed to load vendors."))
                .finally(() => setVendorsLoading(false));
        }
    }, [currentStep]);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.item_name.trim()) {
            toast.error("Item name is required.");
            return;
        }
        if (!newItem.quantity || newItem.quantity < 1) {
            toast.error("Quantity must be at least 1.");
            return;
        }
        setItems((prev) => [...prev, { ...newItem, quantity: parseInt(newItem.quantity) || 1 }]);
        setNewItem({ item_name: "", quantity: 1, unit: "", specifications: "" });
    };

    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleToggleVendor = (id) => {
        setSelectedVendorIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const handleNext = async () => {
        // Validate each step
        if (currentStep === 0) {
            if (!title.trim()) {
                toast.error("RFQ Title is required.");
                return;
            }
            if (!deadline) {
                toast.error("Submission Deadline is required.");
                return;
            }
            if (new Date(deadline) <= new Date()) {
                toast.error("Deadline must be in the future.");
                return;
            }
        }

        if (currentStep === 1 && items.length === 0) {
            toast.error("Please add at least one line item.");
            return;
        }

        if (currentStep === 2 && selectedVendorIds.length === 0) {
            toast.error("Please select at least one vendor to invite.");
            return;
        }

        // Step 3 → Submit draft first, then publish
        if (currentStep === 3) {
            try {
                const payload = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    deadline,
                    items,
                    vendor_ids: selectedVendorIds,
                    status: "draft",
                };

                const created = await createRFQ(payload);
                if (!created?.id) {
                    toast.error("Failed to save RFQ. Please try again.");
                    return;
                }

                setCreatedRFQ(created);

                // Publish immediately after draft creation
                await publishRFQ(created.id);

                toast.success("RFQ created and published successfully!");
                setCurrentStep(4);
            } catch (err) {
                const msg = err.response?.data?.message || err.message || "Something went wrong.";
                toast.error(msg);
            }
            return;
        }

        setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => setCurrentStep((prev) => prev - 1);

    const isBusy = isCreating || isPublishing;

    return (
        <VendorBridgeShell active="RFQs" searchPlaceholder="Search RFQs, Vendors...">
            <section className="vb-page-header is-flat">
                <div>
                    <h2>Create New RFQ</h2>
                    <p>Capture sourcing details, line items, and invite vendors.</p>
                </div>
            </section>

            {/* Step Indicator */}
            <nav
                className="vb-stepper"
                aria-label="RFQ creation progress"
                style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}
            >
                {steps.map((step, index) => (
                    <div
                        className={index === currentStep ? "is-active" : index < currentStep ? "is-complete" : ""}
                        key={step}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            opacity: index <= currentStep ? 1 : 0.45,
                            fontWeight: index === currentStep ? "700" : "normal",
                            fontSize: "14px",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-grid",
                                width: "26px",
                                height: "26px",
                                placeItems: "center",
                                borderRadius: "50%",
                                background:
                                    index < currentStep
                                        ? "var(--vb-primary)"
                                        : index === currentStep
                                        ? "var(--vb-primary-container, #2d7a45)"
                                        : "#cbd5e1",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "600",
                            }}
                        >
                            {index < currentStep ? "✓" : index + 1}
                        </span>
                        {step}
                    </div>
                ))}
            </nav>

            <section
                className="vb-form-card"
                style={{
                    background: "white",
                    padding: "32px",
                    borderRadius: "8px",
                    border: "1px solid var(--vb-border-subtle)",
                }}
            >
                {/* ─── Step 0: RFQ Info ─────────────────────────────────────── */}
                {currentStep === 0 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Basic Information</h3>
                        <form className="vb-rfq-form" onSubmit={(e) => e.preventDefault()}>
                            {/* Title */}
                            <label className="is-wide">
                                <span>RFQ Title <span style={{ color: "var(--vb-danger)" }}>*</span></span>
                                <input
                                    placeholder="e.g. Q3 Server Hardware Refresh"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </label>

                            {/* Deadline */}
                            <label>
                                <span>Submission Deadline <span style={{ color: "var(--vb-danger)" }}>*</span></span>
                                <input
                                    type="date"
                                    value={deadline}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </label>

                            {/* Description */}
                            <label className="is-wide">
                                <span>Description</span>
                                <textarea
                                    placeholder="Describe scope, technical requirements, delivery expectations, and evaluation criteria."
                                    rows="4"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </label>
                        </form>
                    </div>
                )}

                {/* ─── Step 1: Line Items ───────────────────────────────────── */}
                {currentStep === 1 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Line Items</h3>

                        {/* Add item form */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 100px 120px 1fr auto",
                                gap: "12px",
                                marginBottom: "20px",
                                alignItems: "flex-end",
                            }}
                        >
                            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>
                                    Item Name <span style={{ color: "var(--vb-danger)" }}>*</span>
                                </span>
                                <input
                                    placeholder="e.g. Ergonomic Chair"
                                    value={newItem.item_name}
                                    onChange={(e) => setNewItem((p) => ({ ...p, item_name: e.target.value }))}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Qty <span style={{ color: "var(--vb-danger)" }}>*</span></span>
                                <input
                                    type="number"
                                    min="1"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Unit</span>
                                <input
                                    placeholder="e.g. pcs, ream"
                                    value={newItem.unit}
                                    onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Specifications</span>
                                <input
                                    placeholder="e.g. 80 GSM, dual-core"
                                    value={newItem.specifications}
                                    onChange={(e) => setNewItem((p) => ({ ...p, specifications: e.target.value }))}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <button
                                className="vb-save-button"
                                onClick={handleAddItem}
                                style={{ height: "38px", whiteSpace: "nowrap" }}
                            >
                                <Icon>add</Icon> Add
                            </button>
                        </div>

                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Specifications</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ color: "#999" }}>{index + 1}</td>
                                                <td className="vb-company">{item.item_name}</td>
                                                <td><strong>{item.quantity}</strong></td>
                                                <td>{item.unit || "—"}</td>
                                                <td style={{ color: "#666" }}>{item.specifications || "—"}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        onClick={() => handleRemoveItem(index)}
                                                        style={{
                                                            border: "none",
                                                            background: "none",
                                                            color: "var(--vb-danger)",
                                                            cursor: "pointer",
                                                        }}
                                                        aria-label="Remove item"
                                                    >
                                                        <Icon>delete</Icon>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                                                No line items added yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Step 2: Invite Vendors ───────────────────────────────── */}
                {currentStep === 2 && (
                    <div>
                        <h3 style={{ marginBottom: "8px" }}>Invite Target Vendors</h3>
                        <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>
                            Select active vendors to receive this RFQ invitation.
                        </p>

                        {vendorsLoading ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                <Icon style={{ fontSize: "32px" }}>autorenew</Icon>
                                <br />Loading vendors…
                            </div>
                        ) : vendorList.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                No vendors available. Please add vendors first.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {vendorList.map((vendor) => {
                                    const id = vendor.Vendor?.id || vendor.vendor_id || vendor.id;
                                    const name = vendor.Vendor?.company_name || vendor.company_name || vendor.name || vendor.username || id;
                                    const email = vendor.Vendor?.email || vendor.email || "";
                                    const isSelected = selectedVendorIds.includes(id);

                                    return (
                                        <label
                                            key={id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "14px 16px",
                                                borderRadius: "8px",
                                                border: `1px solid ${isSelected ? "var(--vb-primary)" : "#dee2e6"}`,
                                                background: isSelected ? "#e6fcf5" : "transparent",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleVendor(id)}
                                                style={{ width: "18px", height: "18px" }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <strong style={{ display: "block" }}>{name}</strong>
                                                {email && (
                                                    <small style={{ color: "#666" }}>{email}</small>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Icon style={{ color: "var(--vb-primary)", fontSize: "20px" }}>check_circle</Icon>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Step 3: Review ───────────────────────────────────────── */}
                {currentStep === 3 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Review & Publish RFQ</h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "24px",
                                marginBottom: "24px",
                                padding: "20px",
                                background: "#f8fafc",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div>
                                <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>General Details</h4>
                                <p style={{ marginBottom: "6px" }}>
                                    <strong>Title:</strong> {title}
                                </p>
                                <p style={{ marginBottom: "6px" }}>
                                    <strong>Deadline:</strong>{" "}
                                    {deadline
                                        ? new Date(deadline).toLocaleDateString("en-IN", {
                                              year: "numeric",
                                              month: "long",
                                              day: "2-digit",
                                          })
                                        : "—"}
                                </p>
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Description</h4>
                                <p style={{ whiteSpace: "pre-line", color: description ? "#333" : "#999" }}>
                                    {description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: "10px" }}>Line Items ({items.length})</h4>
                        <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                            <table className="vb-vendor-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Specifications</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ color: "#999" }}>{index + 1}</td>
                                            <td className="vb-company">{item.item_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit || "—"}</td>
                                            <td>{item.specifications || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h4 style={{ marginBottom: "10px" }}>
                            Invited Vendors ({selectedVendorIds.length})
                        </h4>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {selectedVendorIds.map((id) => {
                                const v = vendorList.find(
                                    (vnd) => (vnd.Vendor?.id || vnd.vendor_id || vnd.id) === id
                                );
                                const name = v?.Vendor?.company_name || v?.company_name || v?.name || v?.username || id;
                                return (
                                    <span
                                        key={id}
                                        style={{
                                            background: "#dcfce7",
                                            color: "#166534",
                                            padding: "4px 14px",
                                            borderRadius: "999px",
                                            fontSize: "13px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── Step 4: Success ──────────────────────────────────────── */}
                {currentStep === 4 && (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <Icon
                            style={{
                                fontSize: "72px",
                                color: "var(--vb-success, #22c55e)",
                                marginBottom: "16px",
                                display: "block",
                            }}
                        >
                            check_circle
                        </Icon>
                        <h2 style={{ marginBottom: "8px" }}>RFQ Published Successfully!</h2>
                        {createdRFQ && (
                            <p style={{ color: "#666", marginBottom: "4px" }}>
                                RFQ Number: <strong>{createdRFQ.rfq_number}</strong>
                            </p>
                        )}
                        <p style={{ color: "#666", marginBottom: "28px" }}>
                            The invited vendors have been notified and can now submit their pricing responses.
                        </p>
                        <button
                            className="vb-save-button"
                            onClick={() => navigate("/rfqs")}
                            style={{ margin: "0 auto" }}
                        >
                            Return to RFQ Management
                        </button>
                    </div>
                )}

                {/* ─── Navigation ───────────────────────────────────────────── */}
                {currentStep < 4 && (
                    <footer
                        className="vb-form-actions"
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px",
                            marginTop: "28px",
                            paddingTop: "24px",
                            borderTop: "1px solid #dee2e6",
                        }}
                    >
                        {currentStep > 0 && (
                            <button
                                className="vb-secondary-button"
                                onClick={handleBack}
                                disabled={isBusy}
                            >
                                <Icon>chevron_left</Icon> Back
                            </button>
                        )}
                        <button
                            className="vb-save-button"
                            onClick={handleNext}
                            disabled={isBusy}
                            style={{ minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                            {isBusy ? (
                                <>
                                    <Icon style={{ animation: "spin 1s linear infinite", fontSize: "18px" }}>autorenew</Icon>
                                    {isCreating ? "Creating…" : "Publishing…"}
                                </>
                            ) : (
                                <>
                                    {currentStep === 3 ? "Publish RFQ" : "Next Step"}
                                    <Icon>chevron_right</Icon>
                                </>
                            )}
                        </button>
                    </footer>
                )}
            </section>
        </VendorBridgeShell>
    );
};

export default CreateRFQPage;
