import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { approvalApi } from "@/api/endpoints/approvalApi";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";
import toast from "react-hot-toast";

const getStatusDetails = (status) => {
    switch (status?.toLowerCase()) {
        case "approved":
            return { text: "Approved", tone: "active" };
        case "rejected":
            return { text: "Rejected", tone: "suspended" };
        case "pending":
        default:
            return { text: "Pending Approval", tone: "pending" };
    }
};

const Rating = ({ value }) => {
    const numericValue = parseFloat(value) || 0;
    return (
        <div className="vb-rating" aria-label={`${numericValue} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Icon filled className={star <= numericValue ? "" : "is-muted"} key={star}>
                    star
                </Icon>
            ))}
        </div>
    );
};

const ApprovalsPage = () => {
    const { user } = useAuthStore();
    const role = user?.role || "admin";
    const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedApprovalId, setSelectedApprovalId] = useState(null);
    const [remarks, setRemarks] = useState("");

    // Fetch approvals
    const { data: approvalsData, isLoading } = useQuery({
        queryKey: ["approvals"],
        queryFn: () => approvalApi.getAll().then((res) => res.data?.data || []),
    });

    // Fetch single approval details
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ["approval", selectedApprovalId],
        queryFn: () => {
            if (!selectedApprovalId) return null;
            return approvalApi.getById(selectedApprovalId).then((res) => res.data);
        },
        enabled: !!selectedApprovalId,
    });

    // Mutation: Approve
    const approveMutation = useMutation({
        mutationFn: ({ id, remarks }) => approvalApi.approve(id, remarks),
        onSuccess: () => {
            toast.success("Quotation approved successfully");
            queryClient.invalidateQueries({ queryKey: ["approvals"] });
            queryClient.invalidateQueries({ queryKey: ["approval", selectedApprovalId] });
            setRemarks("");
            setSelectedApprovalId(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to approve quotation");
        },
    });

    // Mutation: Reject
    const rejectMutation = useMutation({
        mutationFn: ({ id, remarks }) => approvalApi.reject(id, remarks),
        onSuccess: () => {
            toast.success("Quotation rejected successfully");
            queryClient.invalidateQueries({ queryKey: ["approvals"] });
            queryClient.invalidateQueries({ queryKey: ["approval", selectedApprovalId] });
            setRemarks("");
            setSelectedApprovalId(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to reject quotation");
        },
    });

    const handleApprove = () => {
        if (!selectedApprovalId) return;
        approveMutation.mutate({ id: selectedApprovalId, remarks });
    };

    const handleReject = () => {
        if (!selectedApprovalId) return;
        if (!remarks.trim()) {
            toast.error("Remarks are required to reject a quotation");
            return;
        }
        rejectMutation.mutate({ id: selectedApprovalId, remarks });
    };

    // Filter approvals by role and tab
    const filteredApprovals = (approvalsData || []).filter((item) => {
        // If manager, only show approvals assigned to them for review
        if (role === "manager" && item.approved_by !== currentUserId) {
            return false;
        }
        // Procurement officers initiated the approvals (user_id), show theirs
        if (role === "procurement_officer" && item.user_id !== currentUserId) {
            return false;
        }

        // Filter by status tab
        if (statusFilter === "Pending") return item.status === "pending";
        if (statusFilter === "Approved") return item.status === "approved";
        if (statusFilter === "Rejected") return item.status === "rejected";
        return true;
    });

    const isPending = (status) => status === "pending";

    return (
        <VendorBridgeShell active="Approvals">
            <div className="vb-breadcrumbs">
                <a href="#">Procurement</a>
                <Icon>chevron_right</Icon>
                <span>Approvals</span>
                {selectedApprovalId && (
                    <>
                        <Icon>chevron_right</Icon>
                        <span>Quotation Review</span>
                    </>
                )}
            </div>

            {!selectedApprovalId ? (
                <>
                    <section className="vb-page-header">
                        <div>
                            <h2>Approval Workflow Queue</h2>
                            <p>Review Quotations submitted by vendors. Manager approvals are required to generate Purchase Orders.</p>
                        </div>
                    </section>

                    <div className="vb-filters" style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span>Status:</span>
                            {["All", "Pending", "Approved", "Rejected"].map((status) => (
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
                                        border: "none",
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <section className="vb-table-card">
                        <div className="vb-table-wrap">
                            <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>RFQ Ref</th>
                                        <th>RFQ Title</th>
                                        <th>Vendor</th>
                                        <th>Quotation Number</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "48px 0" }}>
                                                <div style={{ color: "var(--vb-text-muted)" }}>Loading approvals queue...</div>
                                            </td>
                                        </tr>
                                    ) : filteredApprovals.length > 0 ? (
                                        filteredApprovals.map((item) => {
                                            const statusDetails = getStatusDetails(item.status);
                                            const rfq = item.Quotation?.Rfq || {};
                                            const quote = item.Quotation || {};
                                            const vendor = quote.Vendor || {};

                                            return (
                                                <tr key={item.id}>
                                                    <td className="vb-code">{rfq.rfq_number || "N/A"}</td>
                                                    <td className="vb-company">{rfq.title || "N/A"}</td>
                                                    <td>{vendor.company_name || "N/A"}</td>
                                                    <td className="vb-code">{quote.quotation_number || "N/A"}</td>
                                                    <td>INR {(quote.total_amount || 0).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`vb-status tone-${statusDetails.tone}`}>
                                                            <span />
                                                            {statusDetails.text}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <button
                                                            className={item.status === "pending" ? "vb-save-button" : "vb-secondary-button"}
                                                            onClick={() => setSelectedApprovalId(item.id)}
                                                            style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        >
                                                            <Icon style={{ fontSize: "16px", marginRight: "4px" }}>
                                                                {item.status === "pending" ? "rate_review" : "visibility"}
                                                            </Icon>
                                                            {item.status === "pending" ? "Review" : "View"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "48px 0", color: "var(--vb-text-muted)" }}>
                                                No approvals found in this queue.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : (
                <section
                    className="vb-form-card"
                    style={{
                        background: "white",
                        padding: "32px",
                        borderRadius: "8px",
                        border: "1px solid var(--vb-border-subtle)",
                        maxWidth: "1100px",
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
                            <h2 style={{ margin: 0, fontSize: "24px" }}>Quotation Approval Review</h2>
                            <p style={{ margin: "4px 0 0", color: "#666" }}>
                                Approval ID: {selectedApprovalId}
                            </p>
                        </div>
                        <button className="vb-icon-button" onClick={() => setSelectedApprovalId(null)}>
                            <Icon>close</Icon>
                        </button>
                    </header>

                    {isDetailLoading ? (
                        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--vb-text-muted)" }}>
                            Loading quotation details...
                        </div>
                    ) : detailData ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "32px" }}>
                            {/* Left Side: Quotation Summary */}
                            <div style={{ borderRight: "1px solid #dee2e6", paddingRight: "32px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Quotation Details</h3>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", background: "#f8f9fa", padding: "16px", borderRadius: "6px" }}>
                                    <div>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Vendor Company</strong>
                                            <span style={{ fontSize: "14px", fontWeight: "600" }}>{detailData.vendor?.company_name || "N/A"}</span>
                                        </p>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Vendor Rating</strong>
                                            <Rating value={detailData.vendor?.rating} />
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Vendor GST Number</strong>
                                            <span className="vb-code">{detailData.vendor?.gst_number || "N/A"}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Quotation Number</strong>
                                            <span className="vb-code" style={{ fontSize: "14px", fontWeight: "600" }}>{detailData.quotation?.quotation_number}</span>
                                        </p>
                                        <p style={{ margin: "0 0 8px 0" }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Delivery Promise</strong>
                                            <span>{detailData.quotation?.delivery_days} Days</span>
                                        </p>
                                        <p style={{ margin: 0 }}>
                                            <strong style={{ color: "var(--vb-text-muted)", fontSize: "12px", display: "block" }}>Status</strong>
                                            <span className={`vb-status tone-${getStatusDetails(detailData.approval?.status).tone}`}>
                                                <span />
                                                {getStatusDetails(detailData.approval?.status).text}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Quoted Line Items</h4>
                                <div className="vb-table-wrap" style={{ marginBottom: "24px" }}>
                                    <table className="vb-vendor-table" style={{ minWidth: "100%" }}>
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Tax %</th>
                                                <th>Total Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailData.quotation?.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="vb-company">{item.item_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>INR {(item.unit_price || 0).toLocaleString()}</td>
                                                    <td>{item.tax_percent}%</td>
                                                    <td><strong>INR {(item.total_price || 0).toLocaleString()}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                                    <div>
                                        <strong style={{ fontSize: "12px", color: "var(--vb-text-muted)", display: "block", marginBottom: "6px" }}>Quotation Terms / Notes</strong>
                                        <div style={{ border: "1px solid #dee2e6", padding: "12px", borderRadius: "6px", background: "#f8f9fa", fontSize: "13px", color: "var(--vb-text-main)", whiteSpace: "pre-line", minHeight: "80px" }}>
                                            {detailData.quotation?.notes || "No terms specified."}
                                        </div>
                                    </div>
                                    <div style={{ background: "#f8f9fa", border: "1px solid #dee2e6", padding: "16px", borderRadius: "8px", height: "fit-content" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                                            <span style={{ color: "#666" }}>Subtotal</span>
                                            <strong>INR {(detailData.quotation?.total_amount - (detailData.quotation?.total_amount * 0.18)).toLocaleString()}</strong>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                                            <span style={{ color: "#666" }}>GST / Taxes (18%)</span>
                                            <strong>INR {(detailData.quotation?.total_amount * 0.18).toLocaleString()}</strong>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #dee2e6", paddingTop: "12px", marginTop: "12px" }}>
                                            <span style={{ fontWeight: "600" }}>Total Amount</span>
                                            <strong style={{ color: "var(--vb-primary)", fontSize: "16px" }}>
                                                INR {(detailData.quotation?.total_amount || 0).toLocaleString()}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Approval Action & Timeline */}
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Approval Log & Actions</h3>

                                <div style={{ marginBottom: "24px" }}>
                                    <strong style={{ fontSize: "12px", color: "var(--vb-text-muted)", display: "block", marginBottom: "12px" }}>Approval Status History</strong>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", paddingLeft: "24px" }}>
                                        <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "2px", background: "#dee2e6" }}></div>
                                        
                                        {/* Step 1: Initiated */}
                                        <div style={{ position: "relative" }}>
                                            <span style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#2f9e44", display: "grid", placeItems: "center" }}>
                                                <Icon style={{ color: "white", fontSize: "10px" }}>check</Icon>
                                            </span>
                                            <strong style={{ fontSize: "13px", display: "block" }}>Approval Initiated</strong>
                                            <span style={{ fontSize: "12px", color: "#666" }}>
                                                Submitted on {new Date(detailData.approval?.initiated_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Step 2: Acted or Pending */}
                                        <div style={{ position: "relative" }}>
                                            {detailData.approval?.status === "pending" ? (
                                                <>
                                                    <span style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff3bf", display: "grid", placeItems: "center" }}>
                                                        <Icon style={{ color: "#e67700", fontSize: "10px" }}>hourglass_empty</Icon>
                                                    </span>
                                                    <strong style={{ fontSize: "13px", display: "block", color: "#e67700" }}>Pending Action</strong>
                                                    <span style={{ fontSize: "12px", color: "#666" }}>Waiting for Manager review</span>
                                                </>
                                            ) : detailData.approval?.status === "approved" ? (
                                                <>
                                                    <span style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#2f9e44", display: "grid", placeItems: "center" }}>
                                                        <Icon style={{ color: "white", fontSize: "10px" }}>check</Icon>
                                                    </span>
                                                    <strong style={{ fontSize: "13px", display: "block", color: "#2f9e44" }}>Approved</strong>
                                                    <span style={{ fontSize: "12px", color: "#666" }}>
                                                        Quotation approved on {new Date(detailData.approval?.acted_at).toLocaleDateString()}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#ffe3e3", display: "grid", placeItems: "center" }}>
                                                        <Icon style={{ color: "#c92a2a", fontSize: "10px" }}>close</Icon>
                                                    </span>
                                                    <strong style={{ fontSize: "13px", display: "block", color: "#c92a2a" }}>Rejected</strong>
                                                    <span style={{ fontSize: "12px", color: "#666" }}>
                                                        Quotation rejected on {new Date(detailData.approval?.acted_at).toLocaleDateString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {detailData.approval?.remarks && (
                                    <div style={{ marginBottom: "24px", background: "#f8f9fa", padding: "16px", borderRadius: "6px", border: "1px solid #dee2e6" }}>
                                        <strong style={{ fontSize: "12px", color: "var(--vb-text-muted)", display: "block", marginBottom: "6px" }}>Decision Remarks</strong>
                                        <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic" }}>
                                            &ldquo;{detailData.approval.remarks}&rdquo;
                                        </p>
                                    </div>
                                )}

                                {detailData.approval?.status === "pending" && (role === "manager" || role === "admin" || role === "procurement_officer") && (

                                    <div style={{ borderTop: "1px solid #dee2e6", paddingTop: "24px" }}>
                                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--vb-text-muted)" }}>
                                                Approval / Rejection Remarks
                                            </span>
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Write approval justification or reason for rejection (required for rejection)..."
                                                rows="4"
                                                style={{
                                                    padding: "8px 12px",
                                                    border: "1px solid #dee2e6",
                                                    borderRadius: "4px",
                                                    resize: "none",
                                                    fontSize: "13px",
                                                    outline: "none",
                                                }}
                                            />
                                        </label>

                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button
                                                className="vb-save-button"
                                                onClick={handleApprove}
                                                style={{ flex: 1 }}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                            >
                                                <Icon>check</Icon> Approve Quotation
                                            </button>
                                            <button
                                                className="vb-secondary-button"
                                                onClick={handleReject}
                                                style={{ flex: 1, borderColor: "var(--vb-error)", color: "var(--vb-error)", background: "transparent" }}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                            >
                                                <Icon>close</Icon> Reject Quotation
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--vb-error)" }}>
                            Failed to load quotation details.
                        </div>
                    )}

                    <footer
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "32px",
                            borderTop: "1px solid #dee2e6",
                            paddingTop: "24px",
                        }}
                    >
                        <button className="vb-secondary-button" onClick={() => setSelectedApprovalId(null)}>
                            Back to Queue
                        </button>
                    </footer>
                </section>
            )}
        </VendorBridgeShell>
    );
};

export default ApprovalsPage;
