import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { quotationApi } from "@/api/endpoints/quotationApi";
import { rfqApi } from "@/api/endpoints/rfqApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";

const QuotationsPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";

    // View modes: "list", "respond", "view"
    const [viewMode, setViewMode] = useState("list");
    
    // Core state
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [apiError, setApiError] = useState(null);
    
    const [vendorRFQs, setVendorRFQs] = useState([]);
    const [allQuotations, setAllQuotations] = useState([]);

    const [selectedRFQ, setSelectedRFQ] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [existingQuoteId, setExistingQuoteId] = useState(null);

    // Form fields
    const [itemPricing, setItemPricing] = useState({}); // { [rfq_item_id]: { unit_price, delivery_days, tax_percent } }
    const [globalTaxPercent, setGlobalTaxPercent] = useState(18);
    const [paymentTerms, setPaymentTerms] = useState("");
    const [notes, setNotes] = useState("");
    const [validUntil, setValidUntil] = useState("");

    // Load data based on user role
    const loadData = async () => {
        setIsLoadingData(true);
        setApiError(null);
        try {
            if (role === "vendor") {
                const vendorId = user?.Vendor?.id;
                if (vendorId) {
                    const res = await quotationApi.getMyRfqs(vendorId);
                    setVendorRFQs(res.data?.data || []);
                } else {
                    setVendorRFQs([]);
                }
            } else {
                const res = await quotationApi.getAll();
                setAllQuotations(res.data?.data || []);
            }
        } catch (err) {
            console.error("Error loading quotations:", err);
            setApiError(err.response?.data?.message || err.message || "Failed to load data.");
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [role, user]);

    // Handle initiating responding / draft editing
    const startResponding = async (rfqId, quotationId) => {
        setIsLoadingData(true);
        setApiError(null);
        try {
            const rfqRes = await rfqApi.getById(rfqId);
            const detailedRFQ = rfqRes.data?.data?.rfq;
            setSelectedRFQ(detailedRFQ);

            if (quotationId) {
                const quoteRes = await quotationApi.getById(quotationId);
                const detailedQuote = quoteRes.data?.data;
                setSelectedQuotation(detailedQuote);
                setExistingQuoteId(quotationId);

                // Populate form fields
                setPaymentTerms(detailedQuote.payment_terms || "");
                setNotes(detailedQuote.notes || "");
                setValidUntil(detailedQuote.valid_until || "");

                const pricing = {};
                let foundTax = 18;
                detailedQuote.QuotationItems?.forEach((qi) => {
                    pricing[qi.rfq_item_id] = {
                        unit_price: qi.unit_price || 0,
                        delivery_days: qi.delivery_days || 0,
                        tax_percent: qi.tax_percent || 18,
                    };
                    foundTax = qi.tax_percent || 18;
                });
                setItemPricing(pricing);
                setGlobalTaxPercent(foundTax);
            } else {
                setSelectedQuotation(null);
                setExistingQuoteId(null);
                setPaymentTerms("Payment terms: 30 days net");
                setNotes("Standard terms and conditions apply.");
                setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

                const pricing = {};
                detailedRFQ.RfqItems?.forEach((item) => {
                    pricing[item.id] = {
                        unit_price: 0,
                        delivery_days: 7,
                        tax_percent: 18,
                    };
                });
                setItemPricing(pricing);
                setGlobalTaxPercent(18);
            }
            setViewMode("respond");
        } catch (err) {
            console.error("Error loading respond details:", err);
            toast.error(err.response?.data?.message || "Failed to load RFQ details");
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle initiating read-only view
    const startViewingQuotation = async (quoteId) => {
        setIsLoadingData(true);
        setApiError(null);
        try {
            const res = await quotationApi.getById(quoteId);
            setSelectedQuotation(res.data?.data);
            setViewMode("view");
        } catch (err) {
            console.error("Error loading quotation details:", err);
            toast.error(err.response?.data?.message || "Failed to load quotation details.");
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle form price/days updates
    const handlePriceChange = (itemId, field, value) => {
        setItemPricing((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value,
            },
        }));
    };

    // Handle global tax adjustment
    const handleGlobalTaxChange = (val) => {
        const parsed = parseFloat(val) || 0;
        setGlobalTaxPercent(parsed);
        setItemPricing((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((itemId) => {
                updated[itemId] = {
                    ...updated[itemId],
                    tax_percent: parsed,
                };
            });
            return updated;
        });
    };

    // Calculations for the respond view
    const calculateTotals = () => {
        if (!selectedRFQ) return { subtotal: 0, taxAmount: 0, grandTotal: 0 };
        let subtotal = 0;
        let taxAmount = 0;
        selectedRFQ.RfqItems?.forEach((item) => {
            const pricing = itemPricing[item.id] || { unit_price: 0, tax_percent: 18 };
            const itemSubtotal = item.quantity * (parseFloat(pricing.unit_price) || 0);
            const itemTax = itemSubtotal * ((parseFloat(pricing.tax_percent) || 0) / 100);
            subtotal += itemSubtotal;
            taxAmount += itemTax;
        });
        const grandTotal = subtotal + taxAmount;
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            grandTotal: Math.round(grandTotal * 100) / 100,
        };
    };

    const { subtotal, taxAmount, grandTotal } = calculateTotals();

    // Handle save / submit quotation
    const handleSaveQuotation = async (status) => {
        if (!selectedRFQ) return;

        const itemsPayload = [];
        let validationFailed = false;

        for (const item of selectedRFQ.RfqItems || []) {
            const pricing = itemPricing[item.id] || {};
            const unitPrice = parseFloat(pricing.unit_price);
            const deliveryDays = parseInt(pricing.delivery_days);
            const taxPercent = parseFloat(pricing.tax_percent);

            if (status === "submitted") {
                if (isNaN(unitPrice) || unitPrice <= 0) {
                    toast.error(`Please enter a valid unit price for ${item.item_name}`);
                    validationFailed = true;
                    break;
                }
                if (isNaN(deliveryDays) || deliveryDays <= 0) {
                    toast.error(`Please enter valid delivery days for ${item.item_name}`);
                    validationFailed = true;
                    break;
                }
            } else {
                if (unitPrice < 0 || deliveryDays < 0) {
                    toast.error("Prices and delivery days cannot be negative.");
                    validationFailed = true;
                    break;
                }
            }

            itemsPayload.push({
                rfq_item_id: item.id,
                quantity: item.quantity,
                unit_price: unitPrice || 0,
                tax_percent: taxPercent || 0,
                delivery_days: deliveryDays || 0,
            });
        }

        if (validationFailed) return;

        const maxDeliveryDays = itemsPayload.reduce((max, item) => Math.max(max, item.delivery_days), 0);

        const payload = {
            rfq_id: selectedRFQ.id,
            vendor_id: user?.Vendor?.id,
            delivery_days: maxDeliveryDays,
            payment_terms: paymentTerms,
            valid_until: validUntil || null,
            notes: notes,
            items: itemsPayload,
        };

        setIsLoadingData(true);
        try {
            let quotationId = existingQuoteId;
            if (existingQuoteId) {
                await quotationApi.update(existingQuoteId, payload);
                toast.success("Quotation draft updated.");
            } else {
                const res = await quotationApi.create(payload);
                quotationId = res.data?.data?.id;
                toast.success("Quotation draft saved.");
            }

            if (status === "submitted" && quotationId) {
                await quotationApi.submit(quotationId);
                toast.success("Quotation submitted successfully!");
            }

            setViewMode("list");
            loadData();
        } catch (err) {
            console.error("Error saving quotation:", err);
            toast.error(err.response?.data?.message || err.message || "Failed to save quotation.");
        } finally {
            setIsLoadingData(false);
        }
    };

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

            {/* API Error Notification */}
            {apiError && (
                <div className="vb-alert is-error" style={{ marginBottom: "16px", padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px" }}>
                    ⚠ {apiError}
                </div>
            )}

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
                                        <th>Deadline Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingData ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                                <Icon style={{ fontSize: "28px", animation: "spin 1s linear infinite" }}>autorenew</Icon>
                                                <br />Loading RFQs...
                                            </td>
                                        </tr>
                                    ) : vendorRFQs.length > 0 ? (
                                        vendorRFQs.map(({ rfq, quotation_status, quotation_id }) => (
                                            <tr key={rfq.id}>
                                                <td className="vb-code">{rfq.rfq_number}</td>
                                                <td className="vb-company">{rfq.title}</td>
                                                <td>{new Date(rfq.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                                <td>
                                                    <span
                                                        className={`vb-status tone-${
                                                            quotation_status === "submitted" || quotation_status === "accepted"
                                                                ? "active"
                                                                : quotation_status === "draft"
                                                                ? "pending"
                                                                : "suspended"
                                                        }`}
                                                    >
                                                        <span />
                                                        {quotation_status === "submitted"
                                                            ? "Submitted"
                                                            : quotation_status === "draft"
                                                            ? "Draft"
                                                            : quotation_status === "accepted"
                                                            ? "Accepted"
                                                            : quotation_status === "rejected"
                                                            ? "Rejected"
                                                            : "Not Responded"}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    {quotation_status === "submitted" || quotation_status === "accepted" || quotation_status === "rejected" ? (
                                                        <button
                                                            className="vb-secondary-button"
                                                            onClick={() => startViewingQuotation(quotation_id)}
                                                        >
                                                            <Icon>visibility</Icon> View Response
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="vb-save-button"
                                                            onClick={() => startResponding(rfq.id, quotation_id)}
                                                        >
                                                            <Icon>rate_review</Icon>{" "}
                                                            {quotation_status === "draft" ? "Edit Draft" : "Respond"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "var(--vb-text-muted)" }}>
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
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Submitted Date</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingData ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                                                <Icon style={{ fontSize: "28px", animation: "spin 1s linear infinite" }}>autorenew</Icon>
                                                <br />Loading Quotations...
                                            </td>
                                        </tr>
                                    ) : allQuotations.length > 0 ? (
                                        allQuotations.map((quote) => (
                                            <tr key={quote.id}>
                                                <td className="vb-code">{quote.quotation_number}</td>
                                                <td className="vb-code">{quote.Rfq?.rfq_number || "—"}</td>
                                                <td className="vb-company">{quote.Rfq?.title || "—"}</td>
                                                <td>{quote.Vendor?.company_name || "—"}</td>
                                                <td>INR {quote.total_amount ? parseFloat(quote.total_amount).toLocaleString() : "0"}</td>
                                                <td>
                                                    <span
                                                        className={`vb-status tone-${
                                                            quote.status === "submitted" || quote.status === "accepted"
                                                                ? "active"
                                                                : quote.status === "draft"
                                                                ? "pending"
                                                                : "suspended"
                                                        }`}
                                                    >
                                                        <span />
                                                        {quote.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {quote.submitted_at
                                                        ? new Date(quote.submitted_at).toLocaleDateString("en-IN")
                                                        : "N/A"}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        className="vb-secondary-button"
                                                        onClick={() => startViewingQuotation(quote.id)}
                                                    >
                                                        <Icon>visibility</Icon> Review Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "var(--vb-text-muted)" }}>
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

            {/* Submission Form: Respond View */}
            {viewMode === "respond" && selectedRFQ && (
                <section
                    className="vb-form-card"
                    style={{
                        background: "white",
                        padding: "32px",
                        borderRadius: "8px",
                        border: "1px solid var(--vb-border-subtle)",
                        maxWidth: "1000px",
                        margin: "0 auto",
                    }}
                >
                    <header
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #dee2e6",
                            paddingBottom: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: "24px" }}>Submit Quotation</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                RFQ: {selectedRFQ.title} (Deadline: {new Date(selectedRFQ.deadline).toLocaleDateString()})
                            </p>
                        </div>
                        <button className="vb-icon-button" onClick={() => setViewMode("list")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                            <Icon>close</Icon>
                        </button>
                    </header>

                    {/* RFQ Description Box */}
                    {selectedRFQ.description && (
                        <div
                            style={{
                                border: "1px solid #dee2e6",
                                borderRadius: "6px",
                                padding: "16px",
                                background: "#f8f9fa",
                                marginBottom: "24px",
                                fontSize: "13px",
                                color: "#495057",
                            }}
                        >
                            <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600" }}>RFQ Description</h4>
                            <p style={{ margin: 0 }}>{selectedRFQ.description}</p>
                        </div>
                    )}

                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Your Quotation Pricing</h4>

                    {/* Table */}
                    <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                        <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Specifications</th>
                                    <th>Qty</th>
                                    <th>Unit price</th>
                                    <th>Total</th>
                                    <th>Delivery (days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRFQ.RfqItems?.map((item) => {
                                    const pricing = itemPricing[item.id] || {
                                        unit_price: 0,
                                        delivery_days: 7,
                                        tax_percent: 18,
                                    };
                                    const itemTotal = item.quantity * (parseFloat(pricing.unit_price) || 0);

                                    return (
                                        <tr key={item.id}>
                                            <td className="vb-company">{item.item_name}</td>
                                            <td style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>{item.specifications || "—"}</td>
                                            <td>{item.quantity} {item.unit || "units"}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pricing.unit_price || ""}
                                                    onChange={(e) =>
                                                        handlePriceChange(
                                                            item.id,
                                                            "unit_price",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter Price"
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        width: "120px",
                                                    }}
                                                />
                                            </td>
                                            <td><strong>{itemTotal.toLocaleString()}</strong></td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pricing.delivery_days || ""}
                                                    onChange={(e) =>
                                                        handlePriceChange(
                                                            item.id,
                                                            "delivery_days",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Days"
                                                    style={{
                                                        padding: "6px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        width: "90px",
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
                                    value={globalTaxPercent}
                                    onChange={(e) => handleGlobalTaxChange(e.target.value)}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "160px",
                                    }}
                                />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Payment Terms</span>
                                <input
                                    type="text"
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    placeholder="e.g. 30 days net"
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                    }}
                                />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Notes / terms</span>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter payment or delivery clauses..."
                                    rows="4"
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        resize: "vertical",
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
                                height: "fit-content",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                                <span style={{ color: "#666" }}>Subtotal</span>
                                <strong>INR {subtotal.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px" }}>
                                <span style={{ color: "#666" }}>GST ({globalTaxPercent}%)</span>
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
                            paddingTop: "24px",
                        }}
                    >
                        <button className="vb-save-button" onClick={() => handleSaveQuotation("submitted")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Icon>check</Icon> Submit Quotation
                        </button>
                        <button className="vb-secondary-button" onClick={() => handleSaveQuotation("draft")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                        maxWidth: "1000px",
                        margin: "0 auto",
                    }}
                >
                    <header
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #dee2e6",
                            paddingBottom: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: "24px" }}>Quotation Details</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                Code: {selectedQuotation.quotation_number} | RFQ Code: {selectedQuotation.Rfq?.rfq_number}
                            </p>
                        </div>
                        <button className="vb-icon-button" onClick={() => setViewMode("list")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                            <Icon>close</Icon>
                        </button>
                    </header>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                        <div>
                            <p><strong>Vendor Name:</strong> {selectedQuotation.Vendor?.company_name || "—"}</p>
                            <p><strong>Vendor Email:</strong> {selectedQuotation.Vendor?.email || "—"}</p>
                            <p><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{selectedQuotation.status}</span></p>
                        </div>
                        <div>
                            <p>
                                <strong>Submitted Date:</strong>{" "}
                                {selectedQuotation.submitted_at
                                    ? new Date(selectedQuotation.submitted_at).toLocaleString("en-IN")
                                    : "N/A"}
                            </p>
                            <p><strong>Delivery Time:</strong> {selectedQuotation.delivery_days} Days</p>
                            {selectedQuotation.payment_terms && (
                                <p><strong>Payment Terms:</strong> {selectedQuotation.payment_terms}</p>
                            )}
                        </div>
                    </div>

                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "600" }}>Line Items Pricing</h4>

                    <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                        <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total Price (Incl. GST)</th>
                                    <th>Delivery (days)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedQuotation.QuotationItems?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="vb-company">{item.item_name}</td>
                                        <td>{item.quantity}</td>
                                        <td>INR {item.unit_price ? parseFloat(item.unit_price).toLocaleString() : "0"}</td>
                                        <td><strong>INR {item.total_price ? parseFloat(item.total_price).toLocaleString() : "0"}</strong></td>
                                        <td>{item.delivery_days} Days</td>
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
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #dee2e6", paddingBottom: "12px", fontSize: "16px" }}>
                                <span>Grand Total</span>
                                <strong style={{ color: "var(--vb-primary)", fontSize: "18px" }}>INR {selectedQuotation.total_amount ? parseFloat(selectedQuotation.total_amount).toLocaleString() : "0"}</strong>
                            </div>
                        </div>
                    </div>

                    <footer style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #dee2e6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        {role === "vendor" && selectedQuotation.status === "draft" && (
                            <button className="vb-save-button" onClick={() => startResponding(selectedQuotation.rfq_id, selectedQuotation.id)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Icon>edit</Icon> Edit Response
                            </button>
                        )}
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
