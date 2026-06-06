import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRFQStore } from "@/store/rfqStore";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";

const steps = ["RFQ Info", "Line Items", "Vendors", "Review", "Publish"];

const availableVendors = [
    { name: "Acme Corp Logistics", email: "vendor@company.com", category: "Transport & Freight" },
    { name: "TechPro Hardware Solutions", email: "michael.ross@vendorbridge.com", category: "IT Hardware" },
    { name: "Global Office Supplies Ltd", email: "priya.patel@vendorbridge.com", category: "Office Supplies" },
    { name: "Apex Industrial Materials", email: "david.lee@vendorbridge.com", category: "Raw Materials" },
];

const CreateRFQPage = () => {
    const navigate = useNavigate();
    const addRFQ = useRFQStore((state) => state.addRFQ);
    const [currentStep, setCurrentStep] = useState(0);

    // Form states
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("IT Hardware");
    const [deadline, setDeadline] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [budget, setBudget] = useState("");

    // Line items state
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [newItemQty, setNewItemQty] = useState(1);

    // Selected vendors state
    const [selectedVendors, setSelectedVendors] = useState([]);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        setItems(prev => [...prev, { name: newItemName, quantity: parseInt(newItemQty) || 1 }]);
        setNewItemName("");
        setNewItemQty(1);
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleVendor = (email) => {
        setSelectedVendors(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleNext = () => {
        if (currentStep === 0 && (!title.trim() || !deadline)) {
            toast.error("Please fill in RFQ Title and Deadline date.");
            return;
        }
        if (currentStep === 1 && items.length === 0) {
            toast.error("Please add at least one line item.");
            return;
        }
        if (currentStep === 2 && selectedVendors.length === 0) {
            toast.error("Please select at least one vendor to invite.");
            return;
        }

        if (currentStep === 3) {
            // Save and Publish
            const newRfq = {
                title,
                category,
                deadline,
                description,
                priority,
                budget,
                items,
                invitedVendors: selectedVendors,
                status: "Open",
                statusTone: "open"
            };
            addRFQ(newRfq);
            toast.success("RFQ created and published successfully!");
            setCurrentStep(4);
            return;
        }

        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    return (
        <VendorBridgeShell active="RFQs" searchPlaceholder="Search RFQs, Vendors...">
            <section className="vb-page-header is-flat">
                <div>
                    <h2>Create New RFQ</h2>
                    <p>Capture basic sourcing details, line items, and invite vendors.</p>
                </div>
            </section>

            <nav className="vb-stepper" aria-label="RFQ creation progress" style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                {steps.map((step, index) => (
                    <div 
                        className={index === currentStep ? "is-active" : index < currentStep ? "is-complete" : ""} 
                        key={step}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            opacity: index <= currentStep ? 1 : 0.5,
                            fontWeight: index === currentStep ? "bold" : "normal"
                        }}
                    >
                        <span style={{
                            display: "inline-grid",
                            width: "24px",
                            height: "24px",
                            placeItems: "center",
                            borderRadius: "50%",
                            background: index < currentStep ? "var(--vb-primary)" : index === currentStep ? "var(--vb-primary-container)" : "#ccc",
                            color: "white",
                            fontSize: "12px"
                        }}>
                            {index < currentStep ? "✓" : index + 1}
                        </span>
                        {step}
                    </div>
                ))}
            </nav>

            <section className="vb-form-card" style={{ background: "white", padding: "32px", borderRadius: "8px", border: "1px solid var(--vb-border-subtle)" }}>
                
                {/* Step 0: RFQ Info */}
                {currentStep === 0 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Basic Information</h3>
                        <form className="vb-rfq-form">
                            <label className="is-wide">
                                <span>RFQ Title</span>
                                <input 
                                    placeholder="e.g. Q3 Server Hardware Refresh" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                />
                            </label>
                            <label>
                                <span>Procurement Category</span>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option>IT Hardware</option>
                                    <option>Facilities Management</option>
                                    <option>Professional Services</option>
                                    <option>Logistics</option>
                                    <option>Furniture & Fixtures</option>
                                </select>
                            </label>
                            <label>
                                <span>Submission Deadline</span>
                                <input 
                                    type="date" 
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </label>
                            <label className="is-wide">
                                <span>Description</span>
                                <textarea 
                                    placeholder="Describe scope, technical requirements, delivery expectations, and evaluation criteria." 
                                    rows="4" 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </label>
                            <label>
                                <span>Priority Level</span>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Urgent</option>
                                </select>
                            </label>
                            <label>
                                <span>Budget Range</span>
                                <input 
                                    placeholder="$50,000 - $75,000" 
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                />
                            </label>
                        </form>
                    </div>
                )}

                {/* Step 1: Line Items */}
                {currentStep === 1 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Line Items</h3>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "flex-end" }}>
                            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Item Name / Specification</span>
                                <input 
                                    placeholder="e.g. Ergonomic chair" 
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <label style={{ width: "120px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Quantity</span>
                                <input 
                                    type="number"
                                    min="1"
                                    value={newItemQty}
                                    onChange={(e) => setNewItemQty(e.target.value)}
                                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                />
                            </label>
                            <button 
                                className="vb-save-button" 
                                onClick={handleAddItem}
                                style={{ height: "40px" }}
                            >
                                <Icon>add</Icon> Add
                            </button>
                        </div>

                        <div className="vb-table-wrap" style={{ marginTop: "16px" }}>
                            <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Quantity</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="vb-company">{item.name}</td>
                                                <td><strong>{item.quantity}</strong></td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button 
                                                        onClick={() => handleRemoveItem(index)}
                                                        style={{ border: "none", background: "none", color: "var(--vb-danger)", cursor: "pointer" }}
                                                    >
                                                        <Icon>delete</Icon>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                                                No line items added yet. Please use the form above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Step 2: Invite Vendors */}
                {currentStep === 2 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Invite Target Vendors</h3>
                        <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Select one or more active suppliers to receive this procurement request.</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {availableVendors.map((vendor) => (
                                <label 
                                    key={vendor.email} 
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "16px",
                                        borderRadius: "6px",
                                        border: "1px solid #dee2e6",
                                        background: selectedVendors.includes(vendor.email) ? "#e6fcf5" : "transparent",
                                        cursor: "pointer"
                                    }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={selectedVendors.includes(vendor.email)}
                                        onChange={() => handleToggleVendor(vendor.email)}
                                        style={{ width: "18px", height: "18px" }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ display: "block" }}>{vendor.name}</strong>
                                        <small style={{ color: "#666" }}>{vendor.category} | {vendor.email}</small>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                    <div>
                        <h3 style={{ marginBottom: "20px" }}>Review & Publish RFQ</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                            <div>
                                <h4 style={{ margin: "0 0 8px 0" }}>General details</h4>
                                <p><strong>Title:</strong> {title}</p>
                                <p><strong>Category:</strong> {category}</p>
                                <p><strong>Deadline:</strong> {deadline}</p>
                                <p><strong>Budget Range:</strong> {budget || "Not Specified"}</p>
                                <p><strong>Priority:</strong> {priority}</p>
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 8px 0" }}>Description</h4>
                                <p style={{ whiteSpace: "pre-line" }}>{description || "No description provided."}</p>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: "8px" }}>Line Items ({items.length})</h4>
                        <ul style={{ paddingLeft: "20px", marginBottom: "24px" }}>
                            {items.map((item, index) => (
                                <li key={index} style={{ marginBottom: "4px" }}>
                                    {item.name} (Qty: <strong>{item.quantity}</strong>)
                                </li>
                            ))}
                        </ul>

                        <h4 style={{ marginBottom: "8px" }}>Invited Vendors ({selectedVendors.length})</h4>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {selectedVendors.map(email => {
                                const vendor = availableVendors.find(v => v.email === email);
                                return (
                                    <span 
                                        key={email}
                                        style={{ background: "#e9ecef", padding: "4px 12px", borderRadius: "999px", fontSize: "12px" }}
                                    >
                                        {vendor?.name || email}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 4: Publish Success */}
                {currentStep === 4 && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Icon style={{ fontSize: "64px", color: "var(--vb-success)", marginBottom: "16px" }}>check_circle</Icon>
                        <h2>RFQ Published Successfully!</h2>
                        <p style={{ color: "#666", marginBottom: "24px" }}>The invited vendors have been notified and can now submit their pricing responses.</p>
                        <button 
                            className="vb-save-button"
                            onClick={() => navigate("/rfqs")}
                            style={{ margin: "0 auto" }}
                        >
                            Return to RFQ Management
                        </button>
                    </div>
                )}

                {currentStep < 4 && (
                    <footer className="vb-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #dee2e6" }}>
                        {currentStep > 0 && (
                            <button className="vb-secondary-button" onClick={handleBack}>
                                <Icon>chevron_left</Icon> Back
                            </button>
                        )}
                        <button className="vb-save-button" onClick={handleNext}>
                            {currentStep === 3 ? "Publish RFQ" : "Next Step"} <Icon>chevron_right</Icon>
                        </button>
                    </footer>
                )}
            </section>
        </VendorBridgeShell>
    );
};

export default CreateRFQPage;
