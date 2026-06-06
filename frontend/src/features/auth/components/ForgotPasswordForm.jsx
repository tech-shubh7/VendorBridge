import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import { authApi } from "@/api/endpoints/authApi";
import { parseApiError } from "@/utils/errorHandler";
import "./AuthForms.css";

const ForgotPasswordForm = () => {
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");
    const [submittedEmail, setSubmittedEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        setStatus("loading");
        setErrorMsg("");

        try {
            await authApi.forgotPassword({ email });
            setSubmittedEmail(email);
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
                <section className="auth-card" aria-labelledby="fp-success-title">
                    <div className="auth-header">
                        <div className="auth-logo" style={{ background: "rgb(0 107 35 / 0.08)", color: "var(--auth-success)" }} aria-hidden="true">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                        </div>
                        <h1 className="auth-title" id="fp-success-title">Check your inbox</h1>
                        <p className="auth-subtitle">
                            We sent a password reset link to<br />
                            <strong style={{ color: "var(--auth-text-main)" }}>{submittedEmail}</strong>
                        </p>
                    </div>

                    <div className="auth-form-wrap" style={{ paddingTop: "0" }}>
                        <div className="fp-info-box">
                            <span className="material-symbols-outlined">info</span>
                            <p>The link expires in <strong>10 minutes</strong>. If you don't see the email, check your spam folder.</p>
                        </div>

                        <button
                            className="auth-submit"
                            style={{ marginTop: "20px" }}
                            onClick={() => setStatus("idle")}
                            type="button"
                        >
                            Resend Email
                        </button>
                    </div>

                    <footer className="auth-footer">
                        <Link className="auth-link" to={ROUTES.LOGIN}>← Back to Sign In</Link>
                    </footer>
                </section>
            </main>
        );
    }

    /* ─── Form state ────────────────────────────────────────── */
    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="fp-title">
                <div className="auth-header">
                    <div className="auth-logo" aria-hidden="true">
                        <span className="material-symbols-outlined">lock_reset</span>
                    </div>
                    <h1 className="auth-title" id="fp-title">Forgot your password?</h1>
                    <p className="auth-subtitle">
                        Enter your account email and we'll send you a reset link.
                    </p>
                </div>

                <div className="auth-form-wrap">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-field" htmlFor="fp-email">
                            <span className="auth-label">Email Address</span>
                            <span className="auth-input-shell">
                                <span className="material-symbols-outlined auth-leading-icon">mail</span>
                                <input
                                    className="auth-input has-leading-icon"
                                    id="fp-email"
                                    name="email"
                                    placeholder="name@company.com"
                                    required
                                    type="email"
                                    autoFocus
                                />
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
                            {status === "loading" ? "Sending…" : "Send Reset Link"}
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

export default ForgotPasswordForm;
