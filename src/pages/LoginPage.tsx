import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMetrics } from "../context/MetricsContext";
import { authService } from "../services";
import { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, register, isLoading } = useAuth();
  const { recoveryRate } = useMetrics();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("REVENUE_OPERATOR");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [demoModeEnabled, setDemoModeEnabled] = useState<boolean>(true);

  React.useEffect(() => {
    authService.getEnvironment().then((env) => {
      if (typeof env.demo_mode === "boolean") {
        setDemoModeEnabled(env.demo_mode);
      }
    }).catch(() => {
      setDemoModeEnabled(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (authMode === "signin") {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Authentication failed. Please verify credentials.";
      setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handlePersonaLogin = async (persona: "merchant_owner" | "revenue_operator" | "support_operator" | "admin") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await demoLogin(persona);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Demo login failed.";
      setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address to receive password reset instructions.");
      return;
    }
    setErrorMessage(null);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMessage(res.message);
    } catch {
      setErrorMessage("Unable to process password reset request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-white font-sans flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors">
      {/* Top Bar Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between z-10 py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm group-hover:scale-105 transition-transform text-white">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
            <span>RevivePay</span>
            <span className="text-[var(--color-accent)] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
              AI
            </span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
        >
          <span>Back to Landing Page</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Login / Register Card Area */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto z-10 py-6">
        {/* Left Side: Revive AI Highlights & Problem Context */}
        <div className="md:col-span-5 space-y-6 hidden md:block text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-sm bg-[var(--color-accent)]"></span>
            <span>AUTONOMOUS REVENUE RECOVERY</span>
          </div>

          <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-snug">
            Automated payment recovery and policy enforcement for Razorpay.
          </h2>

          <div className="p-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2 text-xs shadow-premium-sm">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] font-mono text-[10px] uppercase font-bold">
              <span>PROBLEM STATEMENT</span>
              <span className="text-[var(--color-accent)]">REVIVE SOLUTION</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Merchants lose significant revenue every day to transient bank switch glitches, expired cards, and checkout abandonment. Revive evaluates real-time payment telemetry to execute retries at peak liquidity windows.
            </p>
          </div>

          <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Razorpay Webhooks Ingestion with HMAC Verification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
              <span>ML Payment Timing & Gateway Cascade Engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Policy Gates & Operator Approval Workflows</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card with 1-Click Demo Personas */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-6 sm:p-8 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-md backdrop-blur-xl">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  {authMode === "signin" ? "Sign in to RevivePay" : "Create Revive Account"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Enterprise Autonomous Revenue Operating System</p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex p-1 rounded-md bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`px-3 py-1 rounded transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-[var(--color-accent)] text-white font-bold shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`px-3 py-1 rounded transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-[var(--color-accent)] text-white font-bold shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* 1-Click Demo Persona Login Section */}
            {demoModeEnabled ? (
              <div className="p-3.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Sandbox Demo Personas</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">1-Click Test Access</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("merchant_owner")}
                    className="p-2.5 rounded-md bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                  >
                    <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Aditya Sengupta</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono">Merchant Owner</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("revenue_operator")}
                    className="p-2.5 rounded-md bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                  >
                    <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Rohan Deshmukh</p>
                    <p className="text-[10px] text-[var(--color-accent)] font-mono">Revenue Operator</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("support_operator")}
                    className="p-2.5 rounded-md bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                  >
                    <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Sneha Kulkarni</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono">Support Operator</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaLogin("admin")}
                    className="p-2.5 rounded-md bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                  >
                    <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Harsh Chavan</p>
                    <p className="text-[10px] text-purple-500 font-mono">Admin / Lead</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span>Production Security Enforced: Sign in using your registered enterprise credentials.</span>
              </div>
            )}

            {/* Feedback Banners */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-secondary)]">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md px-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-secondary)]">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md pl-10 pr-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-[var(--color-text-secondary)]">Password</label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-[var(--color-accent)] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md pl-10 pr-10 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authMode === "signup" && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Must be ≥10 chars, uppercase, lowercase, digit, and special symbol.
                  </p>
                )}
              </div>

              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-secondary)]">Organization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md px-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans cursor-pointer"
                  >
                    <option value="REVENUE_OPERATOR">Revenue Operator (Recovery Operations)</option>
                    <option value="SUPPORT_OPERATOR">Customer Support (Direct Customer Outreach)</option>
                  </select>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs sm:text-sm shadow-premium-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                <span>
                  {isLoading
                    ? "Authenticating..."
                    : authMode === "signin"
                    ? "Sign In to Revive Command Center"
                    : "Create Revive Account"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-text-secondary)]">
              <span>Want to test without signing in? </span>
              <Link to="/cases/RV-10291" className="text-[var(--color-accent)] font-semibold hover:underline">
                Explore Live Demo Case RV-10291 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)] z-10 py-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <Link to="/security" className="hover:text-[var(--color-text-primary)] transition-colors">
            HMAC-SHA256 webhook verification · SHA-256 audit chaining · TLS 1.3 encryption
          </Link>
        </div>
        <p>© 2026 RevivePay AI, by Harsh Chavan.</p>
      </div>
    </div>
  );
};
