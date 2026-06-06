import { useParams } from "react-router-dom";
import VendorBridgeShell, { Icon } from "@/components/vendorbridge/VendorBridgeShell";

const ProfilePage = () => {
    const { username = "jane.doe" } = useParams();

    return (
        <VendorBridgeShell active="" searchPlaceholder="Search people, teams, or permissions...">
            <section className="vb-profile-panel">
                <div className="vb-profile-avatar">JD</div>
                <div>
                    <p className="vb-code">PROC-2048</p>
                    <h2>{username.replace("@", "")}</h2>
                    <p>Senior Procurement Manager · IT Services</p>
                </div>
                <button className="vb-save-button"><Icon>edit</Icon>Edit Profile</button>
            </section>

            <section className="vb-card-grid">
                <article className="vb-settings-card">
                    <Icon>verified_user</Icon>
                    <div><h3>Approval Authority</h3><p>Can approve RFQs up to $250,000 and POs up to $100,000.</p></div>
                </article>
                <article className="vb-settings-card">
                    <Icon>category</Icon>
                    <div><h3>Assigned Categories</h3><p>IT Hardware, Professional Services, Software Licensing.</p></div>
                </article>
                <article className="vb-settings-card">
                    <Icon>schedule</Icon>
                    <div><h3>Recent Activity</h3><p>Last approved RFQ-9021 and reviewed Vendor VEN-8044.</p></div>
                </article>
            </section>
        </VendorBridgeShell>
    );
};

export default ProfilePage;
