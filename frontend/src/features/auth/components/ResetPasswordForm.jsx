import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import { authApi } from "@/api/endpoints/authApi";
import { parseApiError } from "@/utils/errorHandler";
import "./AuthForms.css";

const ResetPasswordForm = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [showPassword, setShowPassword]        = useState(false);
    const [showConfirm, setShowConfirm]           = useState(false);
    const [status, setStatus]                     = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg]                 = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);

    /** Simple strength checker: 0-4 */
    const checkStrength = (val) => {
        let score = 0;
        if (val.length >= 8)                          score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/\d/.test(val))                           score++;
        if (/[^A-Za-z0-9]/.test(val))                score++;
        return score;
    };

    const strengthLabel  = ["", "Weak", "Fair", "Good", "Strong"];
    const strengthClass  = ["", "fp-str-weak", "fp-str-fair", "fp-str-good", "fp-str-strong"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const password         = fd.get("password");
        const confirm_password = fd.get("confirm_password");

        if (password !== confirm_password) {
            setErrorMsg("Passwords do not match.");
            setStatus("error");
            return;
        }

        setStatus("loading");
        setErrorMsg("");

        try {
            await authApi.resetPassword(token, { password, confirm_password });
            setStatus("success");
        } catch (err) {
            const { message } = parseApiError(err);
            setErrorMsg(message);
            setStatus("error");
        }
    };

    /* ─── Success state ─────────────────────────────────────── */
    if (status === "success") {
        return (
            <main className="auth-page">
                <section className="auth-card" aria-labelledby="rp-success-title">
                    <div className="auth-header">
                        <div
                            className="auth-logo"
                            style={{ background: "rgb(0 107 35 / 0.08)", color: "var(--auth-success)" }}
                            aria-hidden="true"
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                check_circle
                            </span>
                        </div>
                        <h1 className="auth-title" id="rp-success-title">Password reset!</h1>
                        <p className="auth-subtitle">
                            Your password has been updated successfully.<br />
                            You can now sign in with your new password.
                        </p>
                    </div>

                    <div className="auth-form-wrap" style={{ paddingTop: "0" }}>
                        <button
                            className="auth-submit"
                            style={{ marginTop: "8px" }}
                            onClick={() => navigate(ROUTES.LOGIN)}
                            type="button"
                        >
                            Go to Sign In
                        </button>
                    </div>

                    <footer className="auth-footer" />
                </section>
            </main>
        );
    }

    /* ─── Form state ────────────────────────────────────────── */
    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="rp-title">
                <div className="auth-header">
                    <div className="auth-logo" aria-hidden="true">
                        <span className="material-symbols-outlined">lock_open</span>
                    </div>
                    <h1 className="auth-title" id="rp-title">Set a new password</h1>
                    <p className="auth-subtitle">
                        Must be 8+ characters with uppercase, lowercase,<br />a number and a special character (e.g. @#$!).
                    </p>
                </div>

                <div className="auth-form-wrap">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* New password */}
                        <label className="auth-field" htmlFor="rp-password">
                            <span className="auth-label">New Password</span>
                            <span className="auth-input-shell">
                                <span className="material-symbols-outlined auth-leading-icon">lock</span>
                                <input
                                    className="auth-input has-leading-icon has-trailing-button"
                                    id="rp-password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    type={showPassword ? "text" : "password"}
                                    onChange={(e) => setPasswordStrength(checkStrength(e.target.value))}
                                />
                                <button
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </span>

                            {/* Strength meter */}
                            {passwordStrength > 0 && (
                                <div className="fp-strength-wrap">
                                    <div className="fp-strength-bar">
                                        {[1, 2, 3, 4].map((i) => (
                                            <span
                                                key={i}
                                                className={`fp-strength-segment ${i <= passwordStrength ? strengthClass[passwordStrength] : ""}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`fp-strength-label ${strengthClass[passwordStrength]}`}>
                                        {strengthLabel[passwordStrength]}
                                    </span>
                                </div>
                            )}
                        </label>

                        {/* Confirm password */}
                        <label className="auth-field" htmlFor="rp-confirm">
                            <span className="auth-label">Confirm Password</span>
                            <span className="auth-input-shell">
                                <span className="material-symbols-outlined auth-leading-icon">lock_clock</span>
                                <input
                                    className="auth-input has-leading-icon has-trailing-button"
                                    id="rp-confirm"
                                    name="confirm_password"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    type={showConfirm ? "text" : "password"}
                                />
                                <button
                                    className="auth-password-toggle"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    type="button"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined">
                                        {showConfirm ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </span>
                        </label>

                        {status === "error" && (
                            <div className="fp-error-box" role="alert">
                                <span className="material-symbols-outlined">error</span>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Resetting…" : "Reset Password"}
                        </button>
                    </form>
                </div>

                <footer className="auth-footer">
                    Remembered your password?{" "}
                    <Link className="auth-link" to={ROUTES.LOGIN}>Sign In</Link>
                </footer>
            </section>
        </main>
    );
};

export default ResetPasswordForm;
