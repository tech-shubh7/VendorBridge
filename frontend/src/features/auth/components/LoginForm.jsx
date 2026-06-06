import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";
import useLogin from "@/features/auth/hooks/useLogin";
import "./AuthForms.css";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            await loginMutation.mutateAsync({ email, password });
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="login-title">
                <div className="auth-header">
                    <div className="auth-logo" aria-hidden="true">
                        <span className="material-symbols-outlined">handshake</span>
                    </div>
                    <h1 className="auth-title" id="login-title">Sign in to VendorBridge</h1>
                    <p className="auth-subtitle">Welcome back. Please enter your details.</p>
                </div>

                <div className="auth-form-wrap">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-field" htmlFor="email">
                            <span className="auth-label">Email Address</span>
                            <span className="auth-input-shell">
                                <span className="material-symbols-outlined auth-leading-icon">mail</span>
                                <input
                                    className="auth-input has-leading-icon"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    required
                                    type="email"
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
                                    required
                                    type={showPassword ? "text" : "password"}
                                />
                                <button
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword((value) => !value)}
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </span>
                        </label>

                        <div className="auth-row">
                            <label className="auth-check">
                                <input name="remember" type="checkbox" />
                                Remember me
                            </label>
                            <a className="auth-link" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                        </div>

                        <button 
                            className="auth-submit" 
                            type="submit" 
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? "Signing In..." : "Sign In"}
                        </button>
                    </form>
                </div>

                <footer className="auth-footer">
                    Don&apos;t have an account?
                    <Link className="auth-link" to={ROUTES.REGISTER}> Request an account</Link>
                </footer>
            </section>
        </main>
    );
};

export default LoginForm;
