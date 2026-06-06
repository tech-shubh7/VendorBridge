import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import useRegister from "@/features/auth/hooks/useRegister";
import toast from "react-hot-toast";
import "./AuthForms.css";

const RegisterForm = () => {
    const [selectedRole, setSelectedRole] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const registerMutation = useRegister();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");
        const confirm_password = formData.get("confirm_password");
        const role = formData.get("role");

        if (password !== confirm_password) {
            toast.error("Passwords do not match.");
            return;
        }

        // Base fields required by backend Joi schema
        const data = {
            name,
            email,
            password,
            confirm_password,
            role,
        };

        // Vendor-specific fields required/optional when role is 'vendor'
        if (role === "vendor") {
            data.company_name = formData.get("company_name");
            data.contact_person = formData.get("contact_person");
            data.phone = formData.get("phone");
            
            // Optional fields - send only if provided (or pass as empty string/undefined depending on validation)
            const category = formData.get("category");
            const gst_number = formData.get("gst_number");
            const address = formData.get("address");
            const city = formData.get("city");
            const state = formData.get("state");
            const notes = formData.get("notes");

            if (category) data.category = category;
            if (gst_number) data.gst_number = gst_number;
            if (address) data.address = address;
            if (city) data.city = city;
            if (state) data.state = state;
            if (notes) data.notes = notes;
        }

        try {
            await registerMutation.mutateAsync(data);
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card is-register" aria-labelledby="register-title">
                <div className="auth-header">
                    <div className="auth-logo" aria-hidden="true">
                        <span className="material-symbols-outlined">handshake</span>
                    </div>
                    <h1 className="auth-title" id="register-title">VendorBridge</h1>
                    <p className="auth-subtitle">Create your procurement portal account</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Base Fields */}
                    <label className="auth-field" htmlFor="name">
                        <span className="auth-label">Full Name</span>
                        <span className="auth-input-shell">
                            <span className="material-symbols-outlined auth-leading-icon">person</span>
                            <input
                                className="auth-input has-leading-icon"
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                type="text"
                                required
                                minLength={2}
                            />
                        </span>
                    </label>

                    <label className="auth-field" htmlFor="registerEmail">
                        <span className="auth-label">Email Address</span>
                        <span className="auth-input-shell">
                            <span className="material-symbols-outlined auth-leading-icon">mail</span>
                            <input
                                className="auth-input has-leading-icon"
                                id="registerEmail"
                                name="email"
                                placeholder="jane.doe@company.com"
                                type="email"
                                required
                            />
                        </span>
                    </label>

                    <label className="auth-field" htmlFor="password">
                        <span className="auth-label">Password</span>
                        <span className="auth-input-shell">
                            <span className="material-symbols-outlined auth-leading-icon">lock</span>
                            <input
                                className="auth-input has-leading-icon has-trailing-button"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                pattern="^(?=.*[A-Z])(?=.*\d).+$"
                                title="Password must contain at least 1 uppercase letter and 1 number"
                            />
                            <button
                                className="auth-password-toggle"
                                onClick={() => setShowPassword((val) => !val)}
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <span className="material-symbols-outlined">
                                    {showPassword ? "visibility" : "visibility_off"}
                                </span>
                            </button>
                        </span>
                    </label>
                    <span className="auth-password-requirements">
                        Must be at least 8 characters, contain 1 uppercase letter and 1 number.
                    </span>

                    <label className="auth-field" htmlFor="confirm_password">
                        <span className="auth-label">Confirm Password</span>
                        <span className="auth-input-shell">
                            <span className="material-symbols-outlined auth-leading-icon">lock</span>
                            <input
                                className="auth-input has-leading-icon has-trailing-button"
                                id="confirm_password"
                                name="confirm_password"
                                placeholder="••••••••"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                            />
                            <button
                                className="auth-password-toggle"
                                onClick={() => setShowConfirmPassword((val) => !val)}
                                type="button"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                <span className="material-symbols-outlined">
                                    {showConfirmPassword ? "visibility" : "visibility_off"}
                                </span>
                            </button>
                        </span>
                    </label>

                    <label className="auth-field" htmlFor="role">
                        <span className="auth-label">Role</span>
                        <span className="auth-input-shell">
                            <span className="material-symbols-outlined auth-leading-icon">manage_accounts</span>
                            <select
                                className="auth-select has-leading-icon"
                                id="role"
                                name="role"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select Role...</option>
                                <option value="vendor">Vendor</option>
                                <option value="manager">Manager</option>
                                <option value="procurement_officer">Procurement Officer</option>
                            </select>
                        </span>
                    </label>

                    {/* Dynamic Vendor Section */}
                    {selectedRole === "vendor" && (
                        <div className="auth-vendor-section">
                            <h2 className="auth-section-title">Vendor Information</h2>

                            <div className="auth-grid">
                                <label className="auth-field" htmlFor="company_name">
                                    <span className="auth-label">Company Name</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">business</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="company_name"
                                            name="company_name"
                                            placeholder="Acme Corporation"
                                            type="text"
                                            required
                                            minLength={2}
                                        />
                                    </span>
                                </label>

                                <label className="auth-field" htmlFor="contact_person">
                                    <span className="auth-label">Contact Person</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">assignment_ind</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="contact_person"
                                            name="contact_person"
                                            placeholder="Jane Doe"
                                            type="text"
                                            required
                                            minLength={2}
                                        />
                                    </span>
                                </label>
                            </div>

                            <div className="auth-grid">
                                <label className="auth-field" htmlFor="phone">
                                    <span className="auth-label">Phone Number</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">call</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="phone"
                                            name="phone"
                                            placeholder="+91 98765 43210"
                                            type="tel"
                                            required
                                            pattern="^\+?[\d\s\-().]{7,20}$"
                                            title="Please enter a valid phone number (7-20 digits)"
                                        />
                                    </span>
                                </label>

                                <label className="auth-field" htmlFor="category">
                                    <span className="auth-label">Category</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">category</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="category"
                                            name="category"
                                            placeholder="e.g. IT Services, Logistics"
                                            type="text"
                                        />
                                    </span>
                                </label>
                            </div>

                            <label className="auth-field" htmlFor="gst_number">
                                <span className="auth-label">GST Number</span>
                                <span className="auth-input-shell">
                                    <span className="material-symbols-outlined auth-leading-icon">receipt_long</span>
                                    <input
                                        className="auth-input has-leading-icon"
                                        id="gst_number"
                                        name="gst_number"
                                        placeholder="e.g. 29AABCD1234E1Z5"
                                        type="text"
                                        pattern="^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$"
                                        title="Please enter a valid 15-character GSTIN (e.g. 29AABCD1234E1Z5)"
                                        style={{ textTransform: "uppercase" }}
                                    />
                                </span>
                            </label>

                            <label className="auth-field" htmlFor="address">
                                <span className="auth-label">Address</span>
                                <textarea
                                    className="auth-textarea"
                                    id="address"
                                    name="address"
                                    placeholder="Plot No, Street, Landmark..."
                                />
                            </label>

                            <div className="auth-grid">
                                <label className="auth-field" htmlFor="city">
                                    <span className="auth-label">City</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">location_city</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="city"
                                            name="city"
                                            placeholder="Bengaluru"
                                            type="text"
                                        />
                                    </span>
                                </label>

                                <label className="auth-field" htmlFor="state">
                                    <span className="auth-label">State</span>
                                    <span className="auth-input-shell">
                                        <span className="material-symbols-outlined auth-leading-icon">map</span>
                                        <input
                                            className="auth-input has-leading-icon"
                                            id="state"
                                            name="state"
                                            placeholder="Karnataka"
                                            type="text"
                                        />
                                    </span>
                                </label>
                            </div>

                            <label className="auth-field" htmlFor="notes">
                                <span className="auth-label">Notes / Comments</span>
                                <textarea
                                    className="auth-textarea"
                                    id="notes"
                                    name="notes"
                                    placeholder="Briefly state your primary services or goods..."
                                />
                            </label>
                        </div>
                    )}

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? "Registering..." : "Register"}
                    </button>
                </form>

                <footer className="auth-footer">
                    Already have an account?
                    <Link className="auth-link" to={ROUTES.LOGIN}> Log in</Link>
                </footer>
            </section>
        </main>
    );
};

export default RegisterForm;

