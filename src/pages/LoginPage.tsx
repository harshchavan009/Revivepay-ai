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
  Cpu,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMetrics } from "../context/MetricsContext";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signin") {
      await login(email, password);
    } else {
      await register(name, email, password, role);
    }
    navigate("/dashboard");
  };

  const handlePersonaLogin = async (persona: "merchant_owner" | "revenue_operator" | "support_operator" | "admin") => {
    await demoLogin(persona);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-white font-sans flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(79,95,240,0.15),rgba(0,0,0,0))] pointer-events-none" />

      {/* Top Bar Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between z-10 py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm group-hover:scale-105 transition-transform text-white">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span>AUTONOMOUS REVENUE RECOVERY</span>
          </div>

          <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight leading-snug">
            Recover up to <span className="text-[var(--color-accent)]">{recoveryRate.toFixed(1)}%</span> of failed payments automatically.
          </h2>

          <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2 text-xs shadow-premium-sm">
            <div className="flex items-center justify-between text-[var(--color-text-muted)] font-mono text-[10px] uppercase font-bold">
              <span>PROBLEM STATEMENT</span>
              <span className="text-[var(--color-accent)]">REVIVE SOLUTION</span>
            </div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Merchants lose significant revenue every day to transient bank switch glitches, expired cards, and checkout abandonment. Revive reads 200+ signals per payment to execute retries at peak liquidity windows.
            </p>
          </div>

          <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Razorpay Webhooks Ingestion with HMAC Verification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
              <span>200+ ML Signals Timing & Cascading Engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span>Ramp-Grade Policy Gates & Operator Approvals</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card with 1-Click Demo Personas */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-md backdrop-blur-xl">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  {authMode === "signin" ? "Sign in to RevivePay" : "Create Revive Account"}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Enterprise Autonomous Revenue Operating System</p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex p-1 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
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
            <div className="p-3.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>1-Click Demo Persona Login</span>
                </span>
                <span className="text-[10px] text-[var(--color-accent)] font-mono font-semibold">Signed Session</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handlePersonaLogin("merchant_owner")}
                  className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                >
                  <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Aditya Sengupta</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono">Merchant Owner</p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonaLogin("revenue_operator")}
                  className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                >
                  <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Rohan Deshmukh</p>
                  <p className="text-[10px] text-[var(--color-accent)] font-mono">Revenue Operator</p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonaLogin("support_operator")}
                  className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                >
                  <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Sneha Kulkarni</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono">Support Operator</p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonaLogin("admin")}
                  className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)] text-left border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group cursor-pointer shadow-sm"
                >
                  <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">Harsh Chavan</p>
                  <p className="text-[10px] text-purple-500 font-mono">Admin / Lead</p>
                </button>
              </div>
            </div>

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
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
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
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-[var(--color-text-secondary)]">Password</label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => alert("Password reset instructions sent to your email.")}
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
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-secondary)]">Organization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[var(--color-accent)] font-sans cursor-pointer"
                  >
                    <option value="REVENUE_OPERATOR">Revenue Operator (Recovery Operations)</option>
                    <option value="MERCHANT_OWNER">Merchant Owner (Executive & Financial View)</option>
                    <option value="SUPPORT_OPERATOR">Customer Support (Direct Customer Outreach)</option>
                    <option value="ADMIN">System Administrator (Full Governance)</option>
                  </select>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs sm:text-sm shadow-premium-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
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
            Built with SOC-2-aligned access controls · PCI-DSS-informed data handling patterns · 256-bit TLS
          </Link>
        </div>
        <p>© 2026 RevivePay AI Inc. All rights reserved.</p>
      </div>
    </div>
  );
};
