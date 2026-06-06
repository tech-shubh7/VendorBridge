import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { quotationApi } from "@/api/endpoints/quotationApi";
import { rfqApi } from "@/api/endpoints/rfqApi";
import { approvalApi } from "@/api/endpoints/approvalApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";
import { QUERY_KEYS } from "@/utils/constants";

const STATUS_TONE = {
    draft: "draft",
    submitted: "open",
    under_review: "evaluating",
    accepted: "active",
    rejected: "suspended",
};

const formatCurrency = (val, currency = "INR") =>
    `${currency} ${(parseFloat(val) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

const QuotationsPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const isVendor = role === "vendor";
    const vendorId = user?.Vendor?.id;
    const qc = useQueryClient();

    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [approverIdInput, setApproverIdInput] = useState("");
    const [compareRfqId, setCompareRfqId] = useState(null);

    // Vendor specific states
    const [vendorTab, setVendorTab] = useState("my-quotations");
    const [selectedRfqForQuoting, setSelectedRfqForQuoting] = useState(null);
    const [editingQuotationId, setEditingQuotationId] = useState(null);
    const [showQuotingModal, setShowQuotingModal] = useState(false);
    
    const [quoteDeliveryDays, setQuoteDeliveryDays] = useState(7);
    const [quotePaymentTerms, setQuotePaymentTerms] = useState("");
    const [quoteNotes, setQuoteNotes] = useState("");
    const [quoteItems, setQuoteItems] = useState({});
    const [isDraftLoading, setIsDraftLoading] = useState(false);

    // Fetch all quotations (filtered for vendor or all for admins/officers/managers)
    const { data: quotations = [], isLoading } = useQuery({
        queryKey: [...QUERY_KEYS.QUOTATIONS, statusFilter],
        queryFn: () => quotationApi.getAll().then((r) => r.data?.data || []),
    });

    // Fetch invitations (for vendors only)
    const { data: invitations = [], isLoading: isInvitationsLoading } = useQuery({
        queryKey: ["my-rfqs", vendorId],
        queryFn: () => quotationApi.getMyRfqs(vendorId).then((r) => r.data?.data || []),
        enabled: isVendor && !!vendorId,
    });

    // Fetch quotation detail
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: QUERY_KEYS.QUOTATION(selectedQuotation?.id),
        queryFn: () => quotationApi.getById(selectedQuotation.id).then((r) => r.data?.data),
        enabled: !!selectedQuotation?.id,
    });

    // Fetch comparison data
    const { data: compareData, isLoading: isCompareLoading } = useQuery({
        queryKey: ["compare", compareRfqId],
        queryFn: () => rfqApi.compareQuotations(compareRfqId).then((r) => r.data?.data || []),
        enabled: !!compareRfqId,
    });

    // Submit mutation
    const submitQuotationMutation = useMutation({
        mutationFn: (id) => quotationApi.submit(id),
        onSuccess: () => {
            toast.success("Quotation submitted successfully!");
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
            qc.invalidateQueries({ queryKey: ["my-rfqs", vendorId] });
            setShowQuotingModal(false);
            setSelectedRfqForQuoting(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to submit quotation"),
    });

    // Create mutation
    const createQuotationMutation = useMutation({
        mutationFn: (payload) => quotationApi.create(payload).then(r => r.data?.data),
        onSuccess: (data, variables) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
            qc.invalidateQueries({ queryKey: ["my-rfqs", vendorId] });
            if (variables.shouldSubmit) {
                submitQuotationMutation.mutate(data.id);
            } else {
                toast.success("Draft saved successfully!");
                setShowQuotingModal(false);
                setSelectedRfqForQuoting(null);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to save draft"),
    });

    // Update mutation
    const updateQuotationMutation = useMutation({
        mutationFn: ({ id, payload }) => quotationApi.update(id, payload).then(r => r.data?.data),
        onSuccess: (data, variables) => {
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
            qc.invalidateQueries({ queryKey: ["my-rfqs", vendorId] });
            if (variables.shouldSubmit) {
                submitQuotationMutation.mutate(variables.id);
            } else {
                toast.success("Draft updated successfully!");
                setShowQuotingModal(false);
                setSelectedRfqForQuoting(null);
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update draft"),
    });

    // Initiate approval
    const initiateApprovalMutation = useMutation({
        mutationFn: ({ quotationId, approverId }) => approvalApi.initiate(quotationId, approverId),
        onSuccess: () => {
            toast.success("Approval initiated successfully!");
            qc.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS });
            setShowInitiateModal(false);
            setApproverIdInput("");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to initiate approval"),
    });

    const handleOpenQuoteForm = async (rfq, quotationId = null) => {
        setSelectedRfqForQuoting(rfq);
        setEditingQuotationId(quotationId);
        
        if (quotationId) {
            setIsDraftLoading(true);
            setShowQuotingModal(true);
            try {
                const res = await quotationApi.getById(quotationId);
                const draft = res.data?.data;
                if (draft) {
                    setQuoteDeliveryDays(draft.delivery_days || 7);
                    setQuotePaymentTerms(draft.payment_terms || "");
                    setQuoteNotes(draft.notes || "");
                    
                    const itemMap = {};
                    (draft.QuotationItems || []).forEach(item => {
                        itemMap[item.rfq_item_id] = {
                            unit_price: item.unit_price || 0,
                            tax_percent: item.tax_percent || 18,
                        };
                    });
                    setQuoteItems(itemMap);
                }
            } catch (err) {
                toast.error("Failed to load draft details.");
            } finally {
                setIsDraftLoading(false);
            }
        } else {
            setQuoteDeliveryDays(7);
            setQuotePaymentTerms("");
            setQuoteNotes("");
            const itemMap = {};
            (rfq.RfqItems || []).forEach(item => {
                itemMap[item.id] = {
                    unit_price: 0,
                    tax_percent: 18,
                };
            });
            setQuoteItems(itemMap);
            setShowQuotingModal(true);
        }
    };

    const handleSaveQuote = (shouldSubmit) => {
        if (!selectedRfqForQuoting) return;
        const itemsPayload = (selectedRfqForQuoting.RfqItems || []).map(item => {
            const itemVal = quoteItems[item.id] || { unit_price: 0, tax_percent: 18 };
            return {
                rfq_item_id: item.id,
                unit_price: parseFloat(itemVal.unit_price) || 0,
                tax_percent: parseFloat(itemVal.tax_percent) || 0,
                quantity: item.quantity,
            };
        });

        const payload = {
            rfq_id: selectedRfqForQuoting.id,
            vendor_id: vendorId,
            delivery_days: parseInt(quoteDeliveryDays) || 0,
            payment_terms: quotePaymentTerms,
            notes: quoteNotes,
            items: itemsPayload,
        };

        if (editingQuotationId) {
            updateQuotationMutation.mutate({ id: editingQuotationId, payload, shouldSubmit });
        } else {
            createQuotationMutation.mutate({ payload, shouldSubmit });
        }
    };

    const displayQuotations = isVendor
        ? quotations.filter((q) => q.vendor_id === vendorId)
        : quotations;

    const filteredQuotations = statusFilter === "all"
        ? displayQuotations
        : displayQuotations.filter((q) => q.status === statusFilter);

    const canInitiateApproval = (q) => q.status === "submitted";

    return (
        <VendorBridgeShell active="Quotations">
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>Quotations</span>
                {selectedQuotation && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>{selectedQuotation.quotation_number}</span>
                    </>
                )}
                {compareRfqId && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>Compare</span>
                    </>
                )}
            </div>

            {/* ─── Compare View ─── */}
            {compareRfqId ? (
                <section className="vb-form-card" style={{ background: "white", padding: "32px", borderRadius: "8px", border: "1px solid var(--vb-border-subtle)" }}>
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 style={{ margin: 0 }}>Quotation Comparison</h2>
                        <button className="vb-icon-button" onClick={() => setCompareRfqId(null)}><Icon>close</Icon></button>
                    </header>
                    {isCompareLoading ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-text-muted)" }}>Loading comparison…</div>
                    ) : compareData?.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                            <table className="vb-vendor-table" style={{ minWidth: "600px" }}>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {compareData.map((q) => (
                                            <th key={q.id}>{q.Vendor?.company_name || q.quotation_number}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Quotation No.</strong></td>
                                        {compareData.map((q) => <td key={q.id} className="vb-code">{q.quotation_number}</td>)}
                                    </tr>
                                    <tr>
                                        <td><strong>Total Amount</strong></td>
                                        {compareData.map((q) => (
                                            <td key={q.id} style={{ fontWeight: 700, color: "var(--vb-primary)" }}>
                                                {formatCurrency(q.total_amount)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td><strong>Delivery Days</strong></td>
                                        {compareData.map((q) => <td key={q.id}>{q.delivery_days} days</td>)}
                                    </tr>
                                    <tr>
                                        <td><strong>Payment Terms</strong></td>
                                        {compareData.map((q) => <td key={q.id}>{q.payment_terms || "—"}</td>)}
                                    </tr>
                                    <tr>
                                        <td><strong>Status</strong></td>
                                        {compareData.map((q) => (
                                            <td key={q.id}>
                                                <span className={`vb-status tone-${STATUS_TONE[q.status] || "draft"}`}>
                                                    <span />{q.status}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td><strong>Notes</strong></td>
                                        {compareData.map((q) => <td key={q.id} style={{ fontSize: "12px", color: "#666" }}>{q.notes || "—"}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>No submitted quotations to compare for this RFQ.</div>
                    )}
                    <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                        <button className="vb-secondary-button" onClick={() => setCompareRfqId(null)}>Back</button>
                    </footer>
                </section>
            ) : !selectedQuotation ? (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Quotation Management</h2>
                            <p>{isVendor ? "Submit quotations and track your bidding history." : "Review and manage all vendor quotations."}</p>
                        </div>
                    </section>

                    {/* Tabs for Vendor */}
                    {isVendor && (
                        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--vb-border-subtle)" }}>
                            <button
                                onClick={() => setVendorTab("my-quotations")}
                                style={{
                                    padding: "10px 16px",
                                    background: "none",
                                    border: "none",
                                    borderBottom: vendorTab === "my-quotations" ? "2px solid var(--vb-primary)" : "none",
                                    fontWeight: vendorTab === "my-quotations" ? "600" : "400",
                                    color: vendorTab === "my-quotations" ? "var(--vb-primary)" : "var(--vb-text-secondary)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                My Quotations
                            </button>
                            <button
                                onClick={() => setVendorTab("invitations")}
                                style={{
                                    padding: "10px 16px",
                                    background: "none",
                                    border: "none",
                                    borderBottom: vendorTab === "invitations" ? "2px solid var(--vb-primary)" : "none",
                                    fontWeight: vendorTab === "invitations" ? "600" : "400",
                                    color: vendorTab === "invitations" ? "var(--vb-primary)" : "var(--vb-text-secondary)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                RFQ Invitations
                            </button>
                        </div>
                    )}

                    {/* Status Filter for Quotations list */}
                    {(!isVendor || vendorTab === "my-quotations") && (
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                            {["all", "draft", "submitted", "under_review", "accepted", "rejected"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    style={{
                                        padding: "6px 16px",
                                        borderRadius: "999px",
                                        border: "1px solid",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: statusFilter === s ? "600" : "400",
                                        background: statusFilter === s ? "var(--vb-primary)" : "transparent",
                                        color: statusFilter === s ? "white" : "var(--vb-text-secondary)",
                                        borderColor: statusFilter === s ? "var(--vb-primary)" : "var(--vb-border-subtle)",
                                        textTransform: "capitalize",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {s === "all" ? "All" : s.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    )}

                    {isVendor && vendorTab === "invitations" ? (
                        /* ─── RFQ Invitations Tab (Vendor) ─── */
                        <section className="vb-table-card">
                            <div className="vb-table-wrap">
                                <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>RFQ Number</th>
                                            <th>Title</th>
                                            <th>Deadline</th>
                                            <th>Quotation Status</th>
                                            <th style={{ textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isInvitationsLoading ? (
                                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "32px", animation: "spin 1s linear  infinite" }}>autorenew</Icon><br />Loading invitations…
                                            </td></tr>
                                        ) : invitations.length === 0 ? (
                                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "48px", display: "block", margin: "0 auto 8px" }}>request_quote</Icon>
                                                No RFQ invitations yet.
                                            </td></tr>
                                        ) : (
                                            invitations.map((inv) => (
                                                <tr key={inv.rfq.id}>
                                                    <td className="vb-code vb-primary-code">{inv.rfq.rfq_number}</td>
                                                    <td className="vb-company">{inv.rfq.title}</td>
                                                    <td>{formatDate(inv.rfq.deadline)}</td>
                                                    <td>
                                                        {inv.quotation_status ? (
                                                            <span className={`vb-status tone-${STATUS_TONE[inv.quotation_status] || "draft"}`}>
                                                                <span />{inv.quotation_status?.replace("_", " ")}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#999", fontSize: "12px" }}>Not Quoted</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        {inv.can_submit ? (
                                                            <button
                                                                className="vb-save-button"
                                                                onClick={() => handleOpenQuoteForm(inv.rfq)}
                                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                            >
                                                                <Icon style={{ fontSize: "16px" }}>rate_review</Icon>Submit Quote
                                                            </button>
                                                        ) : inv.quotation_status === "draft" ? (
                                                            <button
                                                                className="vb-save-button"
                                                                onClick={() => handleOpenQuoteForm(inv.rfq, inv.quotation_id)}
                                                                style={{ padding: "6px 12px", fontSize: "12px", background: "#f59f00" }}
                                                            >
                                                                <Icon style={{ fontSize: "16px" }}>edit</Icon>Edit Draft
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="vb-secondary-button"
                                                                onClick={() => setSelectedQuotation({ id: inv.quotation_id, quotation_number: inv.rfq.rfq_number, status: inv.quotation_status })}
                                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                            >
                                                                <Icon style={{ fontSize: "16px" }}>visibility</Icon>View Quote
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : (
                        /* ─── Quotations Table ─── */
                        <section className="vb-table-card">
                            <div className="vb-table-wrap">
                                <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>Quotation No.</th>
                                            {!isVendor && <th>Vendor</th>}
                                            <th>RFQ</th>
                                            <th>Total Amount</th>
                                            <th>Delivery Days</th>
                                            <th>Submitted</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan={isVendor ? "7" : "8"} style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>autorenew</Icon><br />Loading…
                                            </td></tr>
                                        ) : filteredQuotations.length === 0 ? (
                                            <tr><td colSpan={isVendor ? "7" : "8"} style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "48px", display: "block", margin: "0 auto 8px" }}>rate_review</Icon>
                                                No quotations found.
                                            </td></tr>
                                        ) : (
                                            filteredQuotations.map((q) => (
                                                <tr key={q.id}>
                                                    <td className="vb-code vb-primary-code">{q.quotation_number}</td>
                                                    {!isVendor && <td>{q.Vendor?.company_name || "—"}</td>}
                                                    <td className="vb-code">{q.Rfq?.rfq_number || "—"}</td>
                                                    <td><strong>{formatCurrency(q.total_amount, q.currency)}</strong></td>
                                                    <td>{q.delivery_days ? `${q.delivery_days} days` : "—"}</td>
                                                    <td>{formatDate(q.submitted_at)}</td>
                                                    <td>
                                                        <span className={`vb-status tone-${STATUS_TONE[q.status] || "draft"}`}>
                                                            <span />{q.status?.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                        <button
                                                            className="vb-save-button"
                                                            onClick={() => setSelectedQuotation(q)}
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        >
                                                            <Icon style={{ fontSize: "16px" }}>visibility</Icon>View
                                                        </button>
                                                        {q.Rfq?.id && !isVendor && (
                                                            <button
                                                                className="vb-secondary-button"
                                                                onClick={() => setCompareRfqId(q.Rfq.id)}
                                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                                title="Compare all quotations for this RFQ"
                                                            >
                                                                <Icon style={{ fontSize: "16px" }}>compare</Icon>
                                                            </button>
                                                        )}
                                                        {canInitiateApproval(q) && (role === "admin" || role === "procurement_officer" || role === "officer") && (
                                                            <button
                                                                className="vb-save-button"
                                                                onClick={() => { setSelectedQuotation(q); setShowInitiateModal(true); }}
                                                                style={{ padding: "6px 12px", fontSize: "12px", background: "#2f9e44" }}
                                                                title="Send to Approval"
                                                            >
                                                                <Icon style={{ fontSize: "16px" }}>send</Icon>Approve
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </>
            ) : (
                /* ─── Quotation Detail ─── */
                <section className="vb-form-card" style={{ background: "white", padding: "32px", borderRadius: "8px", border: "1px solid var(--vb-border-subtle)", maxWidth: "1000px", margin: "0 auto" }}>
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #dee2e6", paddingBottom: "20px", marginBottom: "24px" }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Quotation Details</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                <span className="vb-code" style={{ fontWeight: 700, fontSize: "15px" }}>{selectedQuotation.quotation_number}</span>
                                {" · "}
                                <span className={`vb-status tone-${STATUS_TONE[selectedQuotation.status] || "draft"}`} style={{ verticalAlign: "middle" }}>
                                    <span />{selectedQuotation.status?.replace("_", " ")}
                                </span>
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {canInitiateApproval(selectedQuotation) && (role === "admin" || role === "procurement_officer" || role === "officer") && (
                                <button
                                    className="vb-save-button"
                                    onClick={() => setShowInitiateModal(true)}
                                    style={{ background: "#2f9e44" }}
                                >
                                    <Icon>send</Icon> Initiate Approval
                                </button>
                            )}
                            <button className="vb-icon-button" onClick={() => setSelectedQuotation(null)}><Icon>close</Icon></button>
                        </div>
                    </header>

                    {isDetailLoading ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-text-muted)" }}>Loading…</div>
                    ) : detailData ? (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "24px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
                                {[
                                    ["Vendor", detailData.Vendor?.company_name],
                                    ["RFQ", detailData.Rfq?.rfq_number],
                                    ["Total Amount", formatCurrency(detailData.total_amount, detailData.currency)],
                                    ["Delivery Days", detailData.delivery_days ? `${detailData.delivery_days} days` : "—"],
                                    ["Payment Terms", detailData.payment_terms || "—"],
                                    ["Submitted At", formatDate(detailData.submitted_at)],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase" }}>{label}</p>
                                        <p style={{ margin: 0, fontWeight: 500 }}>{val || "—"}</p>
                                    </div>
                                ))}
                            </div>

                            {detailData.QuotationItems?.length > 0 && (
                                <>
                                    <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Line Items</h4>
                                    <div className="vb-table-wrap" style={{ marginBottom: "20px" }}>
                                        <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                            <thead>
                                                <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Tax %</th><th>Total</th></tr>
                                            </thead>
                                            <tbody>
                                                {detailData.QuotationItems.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.RfqItem?.item_name || `Item ${i + 1}`}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCurrency(item.unit_price)}</td>
                                                        <td>{item.tax_percent}%</td>
                                                        <td><strong>{formatCurrency(item.total_price)}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {detailData.notes && (
                                <div style={{ background: "#f8f9fa", border: "1px solid #dee2e6", padding: "16px", borderRadius: "6px" }}>
                                    <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Notes / Terms</p>
                                    <p style={{ margin: 0, fontSize: "13px" }}>{detailData.notes}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-error)" }}>Failed to load details.</div>
                    )}

                    <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px", borderTop: "1px solid #dee2e6", paddingTop: "24px" }}>
                        <button className="vb-secondary-button" onClick={() => setSelectedQuotation(null)}>Back to Quotations</button>
                    </footer>
                </section>
            )}

            {/* Initiate Approval Modal */}
            {showInitiateModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: "12px", padding: "32px", width: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0 }}>Initiate Approval</h3>
                            <button className="vb-icon-button" onClick={() => setShowInitiateModal(false)}><Icon>close</Icon></button>
                        </div>
                        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
                            Send quotation <strong>{selectedQuotation?.quotation_number}</strong> for manager approval.
                        </p>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Manager (Approver) User ID *</span>
                            <input
                                type="text"
                                value={approverIdInput}
                                onChange={(e) => setApproverIdInput(e.target.value)}
                                placeholder="UUID of the manager account"
                                style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                            />
                        </label>
                        <button
                            className="vb-save-button"
                            onClick={() => {
                                if (!approverIdInput.trim()) { toast.error("Approver ID is required"); return; }
                                initiateApprovalMutation.mutate({
                                    quotationId: selectedQuotation?.id,
                                    approverId: approverIdInput.trim(),
                                });
                            }}
                            disabled={initiateApprovalMutation.isPending}
                            style={{ width: "100%" }}
                        >
                            <Icon>send</Icon>
                            {initiateApprovalMutation.isPending ? "Initiating…" : "Send for Approval"}
                        </button>
                    </div>
                </div>
            )}

            {/* Submit / Edit Quotation Modal (Vendor) */}
            {showQuotingModal && selectedRfqForQuoting && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: "12px", padding: "32px", width: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #dee2e6", paddingBottom: "12px" }}>
                            <h3 style={{ margin: 0 }}>
                                {editingQuotationId ? "Edit Draft Quotation" : "Submit Quotation"}
                                <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666", display: "block", marginTop: "4px" }}>
                                    For RFQ: <strong>{selectedRfqForQuoting.rfq_number}</strong> — {selectedRfqForQuoting.title}
                                </span>
                            </h3>
                            <button className="vb-icon-button" onClick={() => { setShowQuotingModal(false); setSelectedRfqForQuoting(null); }}><Icon>close</Icon></button>
                        </div>

                        {isDraftLoading ? (
                            <div style={{ padding: "48px", textAlign: "center", color: "#999" }}>
                                <Icon style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>autorenew</Icon><br />Loading draft details…
                            </div>
                        ) : (
                            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <label className="vb-field" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Delivery Lead Time (Days) *</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quoteDeliveryDays}
                                            onChange={(e) => setQuoteDeliveryDays(e.target.value)}
                                            style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                                            required
                                        />
                                    </label>
                                    <label className="vb-field" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Payment Terms</span>
                                        <input
                                            type="text"
                                            value={quotePaymentTerms}
                                            onChange={(e) => setQuotePaymentTerms(e.target.value)}
                                            placeholder="e.g. Net 30, COD"
                                            style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                                        />
                                    </label>
                                </div>

                                <label className="vb-field" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Notes / Remarks</span>
                                    <textarea
                                        value={quoteNotes}
                                        onChange={(e) => setQuoteNotes(e.target.value)}
                                        placeholder="Add any terms, deviations, or additional comments…"
                                        rows="3"
                                        style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px", resize: "vertical" }}
                                    />
                                </label>

                                <h4 style={{ margin: "10px 0 6px", fontSize: "13px", fontWeight: 600, borderBottom: "1px solid #eee", paddingBottom: "6px" }}>Line Items Pricing</h4>
                                <div className="vb-table-wrap">
                                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Qty</th>
                                                <th>Unit Price (INR) *</th>
                                                <th>Tax %</th>
                                                <th style={{ textAlign: "right" }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedRfqForQuoting.RfqItems || []).map((item) => {
                                                const itemVal = quoteItems[item.id] || { unit_price: 0, tax_percent: 18 };
                                                const qty = item.quantity || 1;
                                                const unitPrice = parseFloat(itemVal.unit_price) || 0;
                                                const taxPct = parseFloat(itemVal.tax_percent) || 0;
                                                const subtotal = (qty * unitPrice) + ((qty * unitPrice) * (taxPct / 100));

                                                return (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <strong>{item.item_name}</strong>
                                                            {item.specifications && (
                                                                <small style={{ display: "block", color: "#666", fontSize: "11px" }}>{item.specifications}</small>
                                                            )}
                                                        </td>
                                                        <td>{qty} {item.unit || "pcs"}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={itemVal.unit_price}
                                                                onChange={(e) => setQuoteItems(prev => ({
                                                                    ...prev,
                                                                    [item.id]: {
                                                                        ...prev[item.id],
                                                                        unit_price: e.target.value,
                                                                    }
                                                                }))}
                                                                style={{ padding: "6px 10px", width: "120px", border: "1px solid #ccc", borderRadius: "4px" }}
                                                                required
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={itemVal.tax_percent}
                                                                onChange={(e) => setQuoteItems(prev => ({
                                                                    ...prev,
                                                                    [item.id]: {
                                                                        ...prev[item.id],
                                                                        tax_percent: e.target.value,
                                                                    }
                                                                }))}
                                                                style={{ padding: "6px 10px", width: "80px", border: "1px solid #ccc", borderRadius: "4px" }}
                                                                required
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                            {formatCurrency(subtotal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #dee2e6", paddingTop: "20px" }}>
                                    <button className="vb-secondary-button" onClick={() => { setShowQuotingModal(false); setSelectedRfqForQuoting(null); }} type="button">
                                        Cancel
                                    </button>
                                    <button
                                        className="vb-secondary-button"
                                        onClick={() => handleSaveQuote(false)}
                                        disabled={createQuotationMutation.isPending || updateQuotationMutation.isPending || submitQuotationMutation.isPending}
                                        type="button"
                                        style={{ border: "1px solid var(--vb-primary)", color: "var(--vb-primary)" }}
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        className="vb-save-button"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to submit this quotation? Once submitted, it cannot be modified or edited.")) {
                                                handleSaveQuote(true);
                                            }
                                        }}
                                        disabled={createQuotationMutation.isPending || updateQuotationMutation.isPending || submitQuotationMutation.isPending}
                                        type="button"
                                    >
                                        Submit Quotation
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </VendorBridgeShell>
    );
};

export default QuotationsPage;

export default QuotationsPage;
