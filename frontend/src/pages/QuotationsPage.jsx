import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRFQStore } from "@/store/rfqStore";
import VendorBridgeShell, { Icon, ToolbarButton } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";

const QuotationsPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const userEmail = user?.email || "vendor@company.com";

    const rfqs = useRFQStore((state) => state.rfqs);
    const quotations = useRFQStore((state) => state.quotations);
    const saveQuotation = useRFQStore((state) => state.saveQuotation);

    // Active sub-view: "list" or "respond" or "view"
    const [viewMode, setViewMode] = useState("list");
    const [selectedRFQ, setSelectedRFQ] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    // Form states for responding
    const [itemPricing, setItemPricing] = useState({}); // { itemName: { unitPrice: 0, deliveryDays: 0 } }
    const [taxPercent, setTaxPercent] = useState(18);
    const [notes, setNotes] = useState("Payment terms: 20 days net...");

    // Populate form if draft exists
    useEffect(() => {
        if (selectedRFQ) {
            const existing = quotations.find(
                (q) => q.rfqCode === selectedRFQ.code && q.vendorEmail === userEmail
            );
            if (existing) {
                const pricing = {};
                existing.items.forEach((item) => {
                    pricing[item.name] = {
                        unitPrice: item.unitPrice || 0,
                        deliveryDays: item.deliveryDays || 0
                    };
                });
                setItemPricing(pricing);
                setTaxPercent(existing.taxPercent || 18);
                setNotes(existing.notes || "");
            } else {
                // Initialize default pricing
                const pricing = {};
                selectedRFQ.items.forEach((item) => {
                    pricing[item.name] = { unitPrice: 0, deliveryDays: 0 };
                });
                setItemPricing(pricing);
                setTaxPercent(18);
                setNotes("Payment terms: 20 days net...");
            }
        }
    }, [selectedRFQ, quotations, userEmail]);

    // Calculations
    const calculateTotals = () => {
        if (!selectedRFQ) return { subtotal: 0, taxAmount: 0, grandTotal: 0 };
        let subtotal = 0;
        selectedRFQ.items.forEach((item) => {
            const pricing = itemPricing[item.name] || { unitPrice: 0 };
            subtotal += item.quantity * (parseFloat(pricing.unitPrice) || 0);
        });
        const taxAmount = (subtotal * (parseFloat(taxPercent) || 0)) / 100;
        const grandTotal = subtotal + taxAmount;
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            grandTotal: Math.round(grandTotal * 100) / 100
        };
    };

    const { subtotal, taxAmount, grandTotal } = calculateTotals();

    const handlePriceChange = (itemName, field, value) => {
        setItemPricing((prev) => ({
            ...prev,
            [itemName]: {
                ...prev[itemName],
                [field]: value
            }
        }));
    };

    const handleSave = (status) => {
        // Validation for final submission
        if (status === "Submitted") {
            const incomplete = selectedRFQ.items.some((item) => {
                const p = itemPricing[item.name];
                return !p || !p.unitPrice || !p.deliveryDays;
            });
            if (incomplete) {
                toast.error("Please enter Unit Price and Delivery Days for all line items.");
                return;
            }
        }

        const quoteItems = selectedRFQ.items.map((item) => {
            const p = itemPricing[item.name] || { unitPrice: 0, deliveryDays: 0 };
            return {
                name: item.name,
                quantity: item.quantity,
                unitPrice: parseFloat(p.unitPrice) || 0,
                total: item.quantity * (parseFloat(p.unitPrice) || 0),
                deliveryDays: parseInt(p.deliveryDays) || 0
            };
        });

        const newQuotation = {
            rfqCode: selectedRFQ.code,
            rfqTitle: selectedRFQ.title,
            vendorEmail: userEmail,
            vendorName: user?.username || "Acme Corp Logistics",
            items: quoteItems,
            taxPercent: parseFloat(taxPercent) || 0,
            subtotal,
            taxAmount,
            grandTotal,
            notes,
            status,
            submittedAt: status === "Submitted" ? new Date().toISOString() : null
        };

        saveQuotation(newQuotation);
        toast.success(
            status === "Submitted"
                ? "Quotation submitted successfully!"
                : "Quotation draft saved."
        );
        setViewMode("list");
        setSelectedRFQ(null);
    };

    // Filter RFQs that invited this vendor
    const invitedRFQs = rfqs.filter((r) => r.invitedVendors?.includes(userEmail));

    return (
        <VendorBridgeShell active="Quotations">
            {/* Breadcrumbs */}
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>Quotations</span>
                {viewMode !== "list" && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>{viewMode === "respond" ? "Submit response" : "View Details"}</span>
                    </>
                )}
            </div>

            {/* List View: For Vendor */}
            {viewMode === "list" && role === "vendor" && (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Received Sourcing RFQs</h2>
                            <p>Select an RFQ procurement request below to respond with your pricing quotation.</p>
                        </div>
                    </section>

                    <section className="vb-table-card">
                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table">
                                <thead>
                                    <tr>
                                        <th>RFQ Code</th>
                                        <th>Title</th>
                                        <th>Procurement Category</th>
                                        <th>Deadline Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invitedRFQs.length > 0 ? (
                                        invitedRFQs.map((rfq) => {
                                            const quote = quotations.find(
                                                (q) => q.rfqCode === rfq.code && q.vendorEmail === userEmail
                                            );
                                            return (
                                                <tr key={rfq.code}>
                                                    <td className="vb-code">{rfq.code}</td>
                                                    <td className="vb-company">{rfq.title}</td>
                                                    <td>{rfq.category}</td>
                                                    <td>{rfq.deadline}</td>
                                                    <td>
                                                        <span
                                                            className={`vb-status tone-${
                                                                quote?.status === "Submitted"
                                                                    ? "active"
                                                                    : quote?.status === "Draft"
                                                                    ? "pending"
                                                                    : "suspended"
                                                            }`}
                                                        >
                                                            <span />
                                                            {quote?.status || "Not Responded"}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        {quote?.status === "Submitted" ? (
                                                            <button
                                                                className="vb-secondary-button"
                                                                onClick={() => {
                                                                    setSelectedRFQ(rfq);
                                                                    setSelectedQuotation(quote);
                                                                    setViewMode("view");
                                                                }}
                                                            >
                                                                <Icon>visibility</Icon> View Response
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="vb-save-button"
                                                                onClick={() => {
                                                                    setSelectedRFQ(rfq);
                                                                    setViewMode("respond");
                                                                }}
                                                            >
                                                                <Icon>rate_review</Icon>{" "}
                                                                {quote?.status === "Draft"
                                                                    ? "Edit Draft"
                                                                    : "Respond"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                style={{
                                                    textAlign: "center",
                                                    padding: "32px",
                                                    color: "var(--vb-text-muted)"
                                                }}
                                            >
                                                No sourcing requests received yet for your account.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {/* List View: For Officer / Manager */}
            {viewMode === "list" && role !== "vendor" && (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Vendor Quotations Comparison</h2>
                            <p>Review and compare pricing details, GST levels, and delivery times submitted by vendors.</p>
                        </div>
                    </section>

                    <section className="vb-table-card">
                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table">
                                <thead>
                                    <tr>
                                        <th>Quotation ID</th>
                                        <th>RFQ Code</th>
                                        <th>RFQ Title</th>
                                        <th>Vendor Name</th>
                                        <th>Subtotal</th>
                                        <th>Grand Total</th>
                                        <th>Status</th>
                                        <th>Submitted Date</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotations.length > 0 ? (
                                        quotations.map((quote) => (
                                            <tr key={quote.id}>
                                                <td className="vb-code">{quote.id}</td>
                                                <td className="vb-code">{quote.rfqCode}</td>
                                                <td className="vb-company">{quote.rfqTitle}</td>
                                                <td>{quote.vendorName}</td>
                                                <td>INR {quote.subtotal.toLocaleString()}</td>
                                                <td>INR {quote.grandTotal.toLocaleString()}</td>
                                                <td>
                                                    <span
                                                        className={`vb-status tone-${
                                                            quote.status === "Submitted"
                                                                ? "active"
                                                                : "pending"
                                                        }`}
                                                    >
                                                        <span />
                                                        {quote.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {quote.submittedAt
                                                        ? new Date(quote.submittedAt).toLocaleDateString()
                                                        : "N/A"}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        className="vb-secondary-button"
                                                        onClick={() => {
                                                            setSelectedQuotation(quote);
                                                            const relatedRFQ = rfqs.find(
                                                                (r) => r.code === quote.rfqCode
                                                            );
                                                            setSelectedRFQ(relatedRFQ);
                                                            setViewMode("view");
                                                        }}
                                                    >
                                                        <Icon>visibility</Icon> Review Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="9"
                                                style={{
                                                    textAlign: "center",
                                                    padding: "32px",
                                                    color: "var(--vb-text-muted)"
                                                }}
                                            >
                                                No quotations submitted yet by invited vendors.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {/* Wireframe Submission Form: Respond View */}
            {viewMode === "respond" && selectedRFQ && (
                <section
                    className="vb-form-card"
                    style={{
                        background: "white",
                        padding: "32px",
                        borderRadius: "8px",
                        border: "1px solid var(--vb-border-subtle)",
                        maxWidth: "1000px"
                    }}
                >
                    <header
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #dee2e6",
                            paddingBottom: "16px",
                            marginBottom: "24px"
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: "24px" }}>Submit Quotations</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                RFQ: {selectedRFQ.title} - deadline {selectedRFQ.deadline}
                            </p>
                        </div>
                        <button className="vb-icon-button" onClick={() => setViewMode("list")}>
                            <Icon>close</Icon>
                        </button>
                    </header>

                    {/* RFQ Summary Box */}
                    <div
                        style={{
                            border: "1px solid #dee2e6",
                            borderRadius: "6px",
                            padding: "16px",
                            background: "#f8f9fa",
                            marginBottom: "24px"
                        }}
                    >
                        <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600" }}>RFQ Summary</h4>
                        <p style={{ margin: 0, color: "#495057", fontSize: "13px" }}>
                            {selectedRFQ.items?.map((item) => `${item.name} * ${item.quantity}`).join(", ")} -
                            category {selectedRFQ.category}
                        </p>
                    </div>

                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Your Quotation</h4>

                    {/* Table */}
                    <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                        <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Unit price</th>
                                    <th>Total</th>
                                    <th>Delivery (days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRFQ.items?.map((item) => {
                                    const pricing = itemPricing[item.name] || {
                                        unitPrice: 0,
                                        deliveryDays: 0
                                    };
                                    const itemTotal = item.quantity * (parseFloat(pricing.unitPrice) || 0);

                                    return (
                                        <tr key={item.name}>
                                            <td className="vb-company">{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pricing.unitPrice || ""}
                                                    onChange={(e) =>
                                                        handlePriceChange(
                                                            item.name,
                                                            "unitPrice",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter Price"
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        width: "120px"
                                                    }}
                                                />
                                            </td>
                                            <td><strong>{itemTotal.toLocaleString()}</strong></td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pricing.deliveryDays || ""}
                                                    onChange={(e) =>
                                                        handlePriceChange(
                                                            item.name,
                                                            "deliveryDays",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Days"
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        width: "90px"
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", borderTop: "1px solid #dee2e6", paddingTop: "24px" }}>
                        {/* Notes and GST Inputs */}
                        <div>
                            <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>tax / GST %</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxPercent}
                                    onChange={(e) => setTaxPercent(e.target.value)}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "160px"
                                    }}
                                />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Note / terms</span>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter payment or delivery clauses..."
                                    rows="4"
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        resize: "vertical"
                                    }}
                                />
                            </label>
                        </div>

                        {/* Summary Totals Card */}
                        <div
                            style={{
                                background: "#f8f9fa",
                                border: "1px solid #dee2e6",
                                borderRadius: "8px",
                                padding: "20px",
                                height: "fit-content"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                                <span style={{ color: "#666" }}>Subtotal</span>
                                <strong>INR {subtotal.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px" }}>
                                <span style={{ color: "#666" }}>GST ({taxPercent}%)</span>
                                <strong>INR {taxAmount.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #dee2e6", paddingTop: "16px", fontSize: "16px" }}>
                                <span>Grand total</span>
                                <strong style={{ color: "var(--vb-primary)", fontSize: "18px" }}>
                                    INR {grandTotal.toLocaleString()}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <footer
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "32px",
                            borderTop: "1px solid #dee2e6",
                            paddingTop: "24px"
                        }}
                    >
                        <button className="vb-save-button" onClick={() => handleSave("Submitted")}>
                            <Icon>check</Icon> Submit Quotation
                        </button>
                        <button className="vb-secondary-button" onClick={() => handleSave("Draft")}>
                            <Icon>save</Icon> Save Draft
                        </button>
                        <button className="vb-secondary-button" onClick={() => setViewMode("list")} style={{ marginLeft: "auto" }}>
                            Cancel
                        </button>
                    </footer>
                </section>
            )}

            {/* Read-only View Details Screen */}
            {viewMode === "view" && selectedQuotation && (
                <section
                    className="vb-form-card"
                    style={{
                        background: "white",
                        padding: "32px",
                        borderRadius: "8px",
                        border: "1px solid var(--vb-border-subtle)",
                        maxWidth: "1000px"
                    }}
                >
                    <header
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #dee2e6",
                            paddingBottom: "16px",
                            marginBottom: "24px"
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: "24px" }}>Quotation Details</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                Code: {selectedQuotation.id} | RFQ: {selectedQuotation.rfqCode}
                            </p>
                        </div>
                        <button className="vb-icon-button" onClick={() => setViewMode("list")}>
                            <Icon>close</Icon>
                        </button>
                    </header>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                        <div>
                            <p><strong>Vendor Name:</strong> {selectedQuotation.vendorName}</p>
                            <p><strong>Vendor Email:</strong> {selectedQuotation.vendorEmail}</p>
                            <p><strong>Status:</strong> {selectedQuotation.status}</p>
                        </div>
                        <div>
                            <p>
                                <strong>Submitted Date:</strong>{" "}
                                {selectedQuotation.submittedAt
                                    ? new Date(selectedQuotation.submittedAt).toLocaleString()
                                    : "N/A"}
                            </p>
                            <p><strong>Tax Percent:</strong> {selectedQuotation.taxPercent}%</p>
                        </div>
                    </div>

                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Line Items pricing</h4>

                    <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                        <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total Price</th>
                                    <th>Delivery (days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedQuotation.items.map((item) => (
                                    <tr key={item.name}>
                                        <td className="vb-company">{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>INR {item.unitPrice.toLocaleString()}</td>
                                        <td><strong>INR {item.total.toLocaleString()}</strong></td>
                                        <td>{item.deliveryDays} Days</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                        <div>
                            <h5 style={{ margin: "0 0 8px 0" }}>Notes / Terms</h5>
                            <div style={{ border: "1px solid #dee2e6", padding: "12px", borderRadius: "6px", background: "#f8f9fa", fontSize: "13px", whiteSpace: "pre-line" }}>
                                {selectedQuotation.notes || "No additional terms specified."}
                            </div>
                        </div>
                        <div style={{ background: "#f8f9fa", border: "1px solid #dee2e6", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span>Subtotal</span>
                                <strong>INR {selectedQuotation.subtotal.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span>GST ({selectedQuotation.taxPercent}%)</span>
                                <strong>INR {selectedQuotation.taxAmount.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #dee2e6", paddingTop: "12px" }}>
                                <span>Grand Total</span>
                                <strong style={{ color: "var(--vb-primary)", fontSize: "16px" }}>INR {selectedQuotation.grandTotal.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>

                    <footer style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #dee2e6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button className="vb-save-button" onClick={() => setViewMode("respond")}>
                            <Icon>edit</Icon> Edit Response
                        </button>
                        <button className="vb-secondary-button" onClick={() => setViewMode("list")}>
                            Back to List
                        </button>
                    </footer>
                </section>
            )}
        </VendorBridgeShell>
    );
};

export default QuotationsPage;
