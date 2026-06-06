import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { poApi } from "@/api/endpoints/poApi";
import { invoiceApi } from "@/api/endpoints/invoiceApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";
import { QUERY_KEYS } from "@/utils/constants";

const STATUS_DETAILS = {
    draft: { text: "Draft", tone: "draft" },
    sent: { text: "Sent to Vendor", tone: "open" },
    acknowledged: { text: "Acknowledged", tone: "evaluating" },
    fulfilled: { text: "Fulfilled", tone: "active" },
    cancelled: { text: "Cancelled", tone: "suspended" },
};

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

const formatCurrency = (val, currency = "INR") =>
    `${currency} ${(parseFloat(val) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PurchaseOrdersPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const qc = useQueryClient();

    const [selectedPO, setSelectedPO] = useState(null);
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ issue_date: "", due_date: "", notes: "" });

    // Fetch all POs
    const { data: pos = [], isLoading } = useQuery({
        queryKey: QUERY_KEYS.PURCHASE_ORDERS,
        queryFn: () => poApi.getAll().then((r) => r.data?.data || []),
    });

    // Fetch PO detail
    const { data: poDetail, isLoading: isDetailLoading } = useQuery({
        queryKey: QUERY_KEYS.PURCHASE_ORDER(selectedPO?.id),
        queryFn: () => poApi.getById(selectedPO.id).then((r) => r.data?.data),
        enabled: !!selectedPO?.id,
    });

    // Send PO
    const sendMutation = useMutation({
        mutationFn: (id) => poApi.send(id),
        onSuccess: () => {
            toast.success("Purchase Order sent to vendor!");
            qc.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
            qc.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDER(selectedPO?.id) });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to send PO"),
    });

    // Create Invoice
    const createInvoiceMutation = useMutation({
        mutationFn: (data) => invoiceApi.create(data),
        onSuccess: () => {
            toast.success("Invoice generated successfully!");
            qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
            setShowCreateInvoice(false);
            setInvoiceForm({ issue_date: "", due_date: "", notes: "" });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to generate invoice"),
    });

    const handleGenerateInvoice = () => {
        if (!invoiceForm.issue_date || !invoiceForm.due_date) {
            toast.error("Issue date and due date are required");
            return;
        }
        createInvoiceMutation.mutate({
            purchase_order_id: selectedPO.id,
            ...invoiceForm,
        });
    };

    const statusD = (status) => STATUS_DETAILS[status] || { text: status, tone: "draft" };
    const canSend = (po) => po?.status === "draft";
    const canInvoice = (po) => po?.status === "sent" || po?.status === "acknowledged";

    return (
        <VendorBridgeShell active="Purchase Orders">
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>Purchase Orders</span>
                {selectedPO && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>{selectedPO.po_number}</span>
                    </>
                )}
            </div>

            {!selectedPO ? (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Purchase Orders</h2>
                            <p>Manage POs generated from approved quotations.</p>
                        </div>
                    </section>

                    <section className="vb-table-card">
                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>PO Number</th>
                                        <th>Vendor</th>
                                        <th>RFQ</th>
                                        <th>Total Amount</th>
                                        <th>Delivery Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "32px" }}>autorenew</Icon>
                                                <br />Loading Purchase Orders…
                                            </td>
                                        </tr>
                                    ) : pos.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "var(--vb-text-muted)" }}>
                                                <Icon style={{ fontSize: "48px", display: "block", margin: "0 auto 8px" }}>receipt_long</Icon>
                                                No Purchase Orders yet. Approve a quotation to generate one.
                                            </td>
                                        </tr>
                                    ) : (
                                        pos.map((po) => {
                                            const sd = statusD(po.status);
                                            return (
                                                <tr key={po.id}>
                                                    <td className="vb-code vb-primary-code">{po.po_number}</td>
                                                    <td>{po.Vendor?.company_name || "—"}</td>
                                                    <td className="vb-code">{po.Quotation?.Rfq?.rfq_number || "—"}</td>
                                                    <td><strong>{formatCurrency(po.total_amount, po.currency)}</strong></td>
                                                    <td>{formatDate(po.delivery_date)}</td>
                                                    <td>
                                                        <span className={`vb-status tone-${sd.tone}`}>
                                                            <span />
                                                            {sd.text}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <button
                                                            className="vb-save-button"
                                                            onClick={() => setSelectedPO(po)}
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        >
                                                            <Icon style={{ fontSize: "16px" }}>visibility</Icon>
                                                            View
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
                <section className="vb-form-card" style={{ background: "white", padding: "32px", borderRadius: "8px", border: "1px solid var(--vb-border-subtle)", maxWidth: "1100px", margin: "0 auto" }}>
                    {/* Header */}
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #dee2e6", paddingBottom: "20px", marginBottom: "24px" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "22px" }}>Purchase Order</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                <span className="vb-code" style={{ fontSize: "16px", fontWeight: 700 }}>{selectedPO.po_number}</span>
                                {" · "}
                                <span className={`vb-status tone-${statusD(selectedPO.status).tone}`} style={{ verticalAlign: "middle" }}>
                                    <span />{statusD(selectedPO.status).text}
                                </span>
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {canSend(selectedPO) && (role === "admin" || role === "procurement_officer" || role === "officer") && (
                                <button
                                    className="vb-save-button"
                                    onClick={() => sendMutation.mutate(selectedPO.id)}
                                    disabled={sendMutation.isPending}
                                >
                                    <Icon>send</Icon> Send to Vendor
                                </button>
                            )}
                            {canInvoice(selectedPO) && (role === "admin" || role === "procurement_officer" || role === "officer") && (
                                <button
                                    className="vb-save-button"
                                    onClick={() => setShowCreateInvoice(true)}
                                    style={{ background: "var(--vb-success, #2f9e44)" }}
                                >
                                    <Icon>receipt</Icon> Generate Invoice
                                </button>
                            )}
                            <button className="vb-icon-button" onClick={() => setSelectedPO(null)}>
                                <Icon>close</Icon>
                            </button>
                        </div>
                    </header>

                    {isDetailLoading ? (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-text-muted)" }}>
                            Loading PO details…
                        </div>
                    ) : poDetail ? (
                        <>
                            {/* PO Meta Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "28px", background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vendor</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{poDetail.po?.Vendor?.company_name || "—"}</p>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{poDetail.po?.Vendor?.gst_number || ""}</p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Delivery Date</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(poDetail.po?.delivery_date)}</p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment Terms</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{poDetail.po?.payment_terms || "—"}</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Line Items</h4>
                            <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                                <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Unit</th>
                                            <th>Unit Price</th>
                                            <th>Tax %</th>
                                            <th>Tax Amt</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(poDetail.items || []).map((item, i) => (
                                            <tr key={i}>
                                                <td className="vb-company">{item.item_name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.unit || "—"}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td>{item.tax_percent}%</td>
                                                <td>{formatCurrency(item.tax_amount)}</td>
                                                <td><strong>{formatCurrency(item.total_price)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <div style={{ minWidth: "280px", background: "#f8f9fa", border: "1px solid #dee2e6", padding: "16px", borderRadius: "8px" }}>
                                    {[
                                        ["Subtotal", formatCurrency(poDetail.po?.subtotal)],
                                        ["Tax Amount", formatCurrency(poDetail.po?.tax_amount)],
                                    ].map(([label, val]) => (
                                        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                                            <span style={{ color: "#666" }}>{label}</span>
                                            <span>{val}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #dee2e6", paddingTop: "12px", marginTop: "4px" }}>
                                        <span style={{ fontWeight: 700 }}>Total</span>
                                        <strong style={{ color: "var(--vb-primary)", fontSize: "16px" }}>{formatCurrency(poDetail.po?.total_amount)}</strong>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: "48px", textAlign: "center", color: "var(--vb-error)" }}>Failed to load PO details.</div>
                    )}

                    {/* Generate Invoice Modal */}
                    {showCreateInvoice && (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ background: "white", borderRadius: "12px", padding: "32px", width: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                    <h3 style={{ margin: 0 }}>Generate Invoice</h3>
                                    <button className="vb-icon-button" onClick={() => setShowCreateInvoice(false)}><Icon>close</Icon></button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Issue Date *</span>
                                        <input
                                            type="date"
                                            value={invoiceForm.issue_date}
                                            onChange={(e) => setInvoiceForm(f => ({ ...f, issue_date: e.target.value }))}
                                            className="vb-input"
                                            style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                                        />
                                    </label>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Due Date *</span>
                                        <input
                                            type="date"
                                            value={invoiceForm.due_date}
                                            onChange={(e) => setInvoiceForm(f => ({ ...f, due_date: e.target.value }))}
                                            className="vb-input"
                                            style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "14px" }}
                                        />
                                    </label>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--vb-text-muted)" }}>Notes</span>
                                        <textarea
                                            value={invoiceForm.notes}
                                            onChange={(e) => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                                            rows="3"
                                            placeholder="Optional notes for the invoice..."
                                            style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px", resize: "none", fontSize: "13px" }}
                                        />
                                    </label>
                                    <button
                                        className="vb-save-button"
                                        onClick={handleGenerateInvoice}
                                        disabled={createInvoiceMutation.isPending}
                                        style={{ marginTop: "8px" }}
                                    >
                                        <Icon>receipt</Icon>
                                        {createInvoiceMutation.isPending ? "Generating…" : "Generate Invoice"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <footer style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px", borderTop: "1px solid #dee2e6", paddingTop: "24px" }}>
                        <button className="vb-secondary-button" onClick={() => setSelectedPO(null)}>Back to Purchase Orders</button>
                    </footer>
                </section>
            )}
        </VendorBridgeShell>
    );
};

export default PurchaseOrdersPage;
