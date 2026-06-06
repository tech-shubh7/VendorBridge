import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import useMe from "@/features/auth/hooks/useMe";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";

const ProfilePage = () => {
    const { username } = useParams();
    const { user } = useAuthStore();
    
    // Ensure fresh user data is fetched when page mounts
    const { isLoading } = useMe();

    // If still loading and we don't have persisted user state, show a clean loading indicator
    if (isLoading && !user) {
        return (
            <VendorBridgeShell active="" searchPlaceholder="Search people, teams, or permissions...">
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                    <div className="vb-loading-spinner">Loading profile...</div>
                </div>
            </VendorBridgeShell>
        );
    }

    // Fallback if no user is authenticated (though ProtectedRoute prevents this)
    if (!user) {
        return (
            <VendorBridgeShell active="" searchPlaceholder="Search people, teams, or permissions...">
                <section className="vb-profile-panel">
                    <h2>No profile found</h2>
                </section>
            </VendorBridgeShell>
        );
    }

    // Derive display details
    const name = user.name || "Jane Doe";
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const email = user.email || "";
    const role = user.role || "admin";

    // Setup role names and descriptions
    let roleTitle = "System Administrator";
    let codePrefix = "ADM";
    let approvalAuthority = "Full approval authority for all RFQs, POs, and Vendor onboardings.";
    let assignedCategories = "All Categories (Global Administrator)";
    let recentActivity = "System configuration updates and role approvals.";

    if (role === "manager") {
        roleTitle = "Senior Procurement Manager";
        codePrefix = "MGR";
        approvalAuthority = "Can approve RFQs up to $250,000 and POs up to $100,000.";
        assignedCategories = "IT Hardware, Professional Services, Software Licensing.";
        recentActivity = "Approved RFQ-9021 and initiated PO-4021.";
    } else if (role === "procurement_officer") {
        roleTitle = "Procurement Officer";
        codePrefix = "PROC";
        approvalAuthority = "Can initiate RFQs and submit evaluations.";
        assignedCategories = "Logistics, Office Supplies, General Operations.";
        recentActivity = "Created RFQ-9025 and reviewed 4 vendor quotations.";
    } else if (role === "vendor") {
        const company = user.Vendor?.company_name || "Vendor Inc.";
        roleTitle = `Vendor Representative (${company})`;
        codePrefix = "VEN";
        approvalAuthority = "Can submit quotes and bid on open RFQs.";
        assignedCategories = user.Vendor?.category || "Registered supplier categories.";
        recentActivity = "Submitted quotation for RFQ-9021.";
    }

    const formattedCode = `${codePrefix}-${user.id ? user.id.slice(0, 8).toUpperCase() : "2048"}`;

    return (
        <VendorBridgeShell active="" searchPlaceholder="Search people, teams, or permissions...">
            <section className="vb-profile-panel" style={{ justifyContent: "flex-start", gap: "24px" }}>
                <div className="vb-profile-avatar">{initials}</div>
                <div>
                    <p className="vb-code">{formattedCode}</p>
                    <h2>{name}</h2>
                    <p>{roleTitle} · {email}</p>
                </div>
            </section>

            <section className="vb-card-grid">
                <article className="vb-settings-card">
                    <Icon>verified_user</Icon>
                    <div>
                        <h3>Approval Authority</h3>
                        <p>{approvalAuthority}</p>
                    </div>
                </article>
                <article className="vb-settings-card">
                    <Icon>category</Icon>
                    <div>
                        <h3>Assigned Categories</h3>
                        <p>{assignedCategories}</p>
                    </div>
                </article>
                <article className="vb-settings-card">
                    <Icon>schedule</Icon>
                    <div>
                        <h3>Recent Activity</h3>
                        <p>{recentActivity}</p>
                    </div>
                </article>
            </section>
        </VendorBridgeShell>
    );
};

export default ProfilePage;
