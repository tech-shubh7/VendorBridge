import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { invoiceApi } from "@/api/endpoints/invoiceApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";
import { QUERY_KEYS } from "@/utils/constants";

const STATUS_DETAILS = {
    draft: { text: "Draft", tone: "draft" },
    sent: { text: "Sent", tone: "open" },
    paid: { text: "Paid", tone: "active" },
    overdue: { text: "Overdue", tone: "suspended" },
    cancelled: { text: "Cancelled", tone: "suspended" },
};

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

const formatCurrency = (val, currency = "INR") =>
    `${currency} ${(parseFloat(val) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoicesPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const qc = useQueryClient();

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailForm, setEmailForm] = useState({ to: "", cc: "", message: "" });

    // Fetch all invoices
    const { data: invoicesData, isLoading } = useQuery({
        queryKey: [...QUERY_KEYS.INVOICES, statusFilter],
        queryFn: () =>
            invoiceApi.getAll(statusFilter !== "all" ? { status: statusFilter } : {})
                .then((r) => r.data),
    });
    const invoices = invoicesData?.data || [];

    // Fetch invoice detail
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: QUERY_KEYS.INVOICE(selectedInvoice?.id),
        queryFn: () => invoiceApi.getById(selectedInvoice.id).then((r) => r.data?.data),
        enabled: !!selectedInvoice?.id,
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => invoiceApi.updateStatus(id, status),
        onSuccess: (_, { status }) => {
            toast.success(`Invoice marked as ${status}`);
            qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICE(selectedInvoice?.id) });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update status"),
    });

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: ({ id, data }) => invoiceApi.sendEmail(id, data),
        onSuccess: () => {
            toast.success("Invoice sent via email!");
            setShowEmailModal(false);
            setEmailForm({ to: "", cc: "", message: "" });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to send email"),
    });

    const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
        try {
            const response = await invoiceApi.downloadPdf(invoiceId);
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${invoiceNumber}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("PDF downloaded!");
        } catch {
            toast.error("Failed to download PDF");
        }
    };

    const handleSendEmail = () => {
        if (!emailForm.to) { toast.error("Recipient email is required"); return; }
        sendEmailMutation.mutate({ id: selectedInvoice.id, data: emailForm });
    };

    const sd = (status) => STATUS_DETAILS[status] || { text: status, tone: "draft" };

    return (
        <VendorBridgeShell active="Invoices">
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>Invoices</span>
                {selectedInvoice && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>{selectedInvoice.invoice_number}</span>
                    </>
                )}
            </div>

            {!selectedInvoice ? (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Invoices</h2>
                            <p>View, download and email invoices generated from Purchase Orders.</p>
                        </div>
                    </section>

                    {/* Status Filter Tabs */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
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
                                {s === "all" ? "All Invoices" : s}
                            </button>
                        ))}
                    </div>

                    <section className="vb-table-card">
                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Invoice No.</th>
                                        <th>PO Number</th>
                                        <th>Vendor</th>
                                        <th>Total Amount</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "32px" }}>autorenew</Icon><br />Loading…
                                            </td>
                                        </tr>
                                    ) : invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "48px", display: "block", margin: "0 auto 8px" }}>receipt</Icon>
                                                No invoices found.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => {
                                            const s = sd(inv.status);
                                            return (
                                                <tr key={inv.id}>
                                                    <td className="vb-code vb-primary-code">{inv.invoice_number}</td>
                                                    <td className="vb-code">{inv.PurchaseOrder?.po_number || "—"}</td>
                                                    <td>{inv.Vendor?.company_name || "—"}</td>
                                                    <td><strong>{formatCurrency(inv.total_amount)}</strong></td>
                                                    <td>{formatDate(inv.issue_date)}</td>
                                                    <td>{formatDate(inv.due_date)}</td>
                                                    <td>
                                                        <span className={`vb-status tone-${s.tone}`}>
                                                            <span />{s.text}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                        <button
                                                            className="vb-save-button"
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        >
                                                            <Icon style={{ fontSize: "16px" }}>visibility</Icon>View
                                                        </button>
                                                        <button
                                                            className="vb-secondary-button"
                                                            onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                            title="Download PDF"
                                                        >
                                                            <Icon style={{ fontSize: "16px" }}>download</Icon>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : (
                // Invoice Detail View
                <section className="vb-form-card" style={{ background: "white", padding: "32px", borderRadius: "8px", border: "1px solid var(--vb-border-subtle)", maxWidth: "1000px", margin: "0 auto" }}>
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #dee2e6", paddingBottom: "20px", marginBottom: "24px" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "22px" }}>Invoice</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                <span className="vb-code" style={{ fontSize: "16px", fontWeight: 700 }}>{selectedInvoice.invoice_number}</span>
                                {" · "}
                                <span className={`vb-status tone-${sd(selectedInvoice.status).tone}`} style={{ verticalAlign: "middle" }}>
                                    <span />{sd(selectedInvoice.status).text}
                                </span>
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                className="vb-secondary-button"
                                onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number)}
                                title="Download PDF"
                            >
                                <Icon>download</Icon> PDF
                            </button>
                            <button
                                className="vb-save-button"
                                onClick={() => setShowEmailModal(true)}
                            >
                                <Icon>email</Icon> Send Email
                            </button>
                            {selectedInvoice.status === "draft" && (
                                <button
                                    className="vb-save-button"
                                    onClick={() => updateStatusMutation.mutate({ id: selectedInvoice.id, status: "sent" })}
                                    disabled={updateStatusMutation.isPending}
                                    style={{ background: "#2f9e44" }}
                                >
                                    <Icon>mark_email_read</Icon> Mark Sent
                                </button>
                            )}
                            {selectedInvoice.status === "sent" && (
                                <button
                                    className="vb-save-button"
                                    onClick={() => updateStatusMutation.mutate({ id: selectedInvoice.id, status: "paid" })}
                                    disabled={updateStatusMutation.isPending}
                                    style={{ background: "#2f9e44" }}
                                >
                                    <Icon>payments</Icon> Mark Paid
                                </button>
                            )}
                            <button className="vb-icon-button" onClick={() => setSelectedInvoice(null)}>
                                <Icon>close</Icon>
                            </button>
                        </div>
                    </header>

                    {isDetailLoading ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-text-muted)" }}>Loading invoice details…</div>
                    ) : detailData ? (
                        <>
                            {/* Meta */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "28px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
                                {[
                                    ["Vendor", detailData.invoice?.Vendor?.company_name],
                                    ["Issue Date", formatDate(detailData.invoice?.issue_date)],
                                    ["Due Date", formatDate(detailData.invoice?.due_date)],
                                    ["GST Number", detailData.invoice?.Vendor?.gst_number || "—"],
                                    ["Payment Terms", detailData.invoice?.payment_terms || "—"],
                                    ["Amount in Words", detailData.invoice?.amount_in_words || "—"],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase" }}>{label}</p>
                                        <p style={{ margin: 0, fontWeight: 500 }}>{val || "—"}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Line Items */}
                            <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Line Items</h4>
                            <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                                <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Tax %</th>
                                            <th>Tax Amt</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(detailData.items || []).map((item, i) => (
                                            <tr key={i}>
                                                <td className="vb-company">{item.item_name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td>{item.tax_percent}%</td>
                                                <td>{formatCurrency(item.tax_amount)}</td>
                                                <td><strong>{formatCurrency(item.total_price)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* GST + Totals */}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <div style={{ minWidth: "300px", background: "#f8f9fa", border: "1px solid #dee2e6", padding: "16px", borderRadius: "8px" }}>
                                    {[
                                        ["Subtotal", formatCurrency(detailData.invoice?.subtotal)],
                                        detailData.invoice?.cgst_amount > 0 && ["CGST", formatCurrency(detailData.invoice?.cgst_amount)],
                                        detailData.invoice?.sgst_amount > 0 && ["SGST", formatCurrency(detailData.invoice?.sgst_amount)],
                                        detailData.invoice?.igst_amount > 0 && ["IGST", formatCurrency(detailData.invoice?.igst_amount)],
                                    ].filter(Boolean).map(([label, val]) => (
                                        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                                            <span style={{ color: "#666" }}>{label}</span>
                                            <span>{val}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #dee2e6", paddingTop: "12px", marginTop: "4px" }}>
                                        <span style={{ fontWeight: 700 }}>Total</span>
                                        <strong style={{ color: "var(--vb-primary)", fontSize: "16px" }}>{formatCurrency(detailData.invoice?.total_amount)}</strong>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-error)" }}>Failed to load invoice details.</div>
                    )}

                    <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px", borderTop: "1px solid #dee2e6", paddingTop: "24px" }}>
                        <button className="vb-secondary-button" onClick={() => setSelectedInvoice(null)}>Back to Invoices</button>
                    </footer>
                </section>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: "12px", padding: "32px", width: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0 }}>Send Invoice by Email</h3>
                            <button className="vb-icon-button" onClick={() => setShowEmailModal(false)}><Icon>close</Icon></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {[
                                { label: "To (Recipient) *", key: "to", placeholder: "vendor@company.com" },
                                { label: "CC (optional)", key: "cc", placeholder: "manager@company.com" },
                            ].map(({ label, key, placeholder }) => (
                                <label key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>{label}</span>
                                    <input
                                        type="email"
                                        value={emailForm[key]}
                                        onChange={(e) => setEmailForm(f => ({ ...f, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                                    />
                                </label>
                            ))}
                            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Message</span>
                                <textarea
                                    value={emailForm.message}
                                    onChange={(e) => setEmailForm(f => ({ ...f, message: e.target.value }))}
                                    rows="3"
                                    placeholder="Optional message to accompany the invoice..."
                                    style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", resize: "none", fontSize: "13px" }}
                                />
                            </label>
                            <button
                                className="vb-save-button"
                                onClick={handleSendEmail}
                                disabled={sendEmailMutation.isPending}
                            >
                                <Icon>send</Icon>
                                {sendEmailMutation.isPending ? "Sending…" : "Send Invoice"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </VendorBridgeShell>
    );
};

export default InvoicesPage;
