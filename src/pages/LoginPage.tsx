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
import { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, switchPersona, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("operator@revivepay.ai");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Rohan Deshmukh");
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

  const handleQuickLogin = (selectedRole: UserRole, demoEmail: string, demoName: string) => {
    switchPersona(selectedRole);
    setEmail(demoEmail);
    setName(demoName);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#041018] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(6,182,212,0.15),rgba(0,0,0,0))] pointer-events-none" />

      {/* Top Bar Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between z-10 py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF5E3A] via-[#FF7A59] to-[#FFA07A] flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
            <span>revive</span>
            <span className="text-cyan-400 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
              AI
            </span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>Back to Landing Page</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Login / Register Card Area */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto z-10 py-6">
        {/* Left Side: Revive AI Highlights & Problem Context (as in reference Image 1) */}
        <div className="md:col-span-5 space-y-6 hidden md:block text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>AUTONOMOUS REVENUE RECOVERY</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            Recover up to <span className="text-cyan-400">65.2%</span> of failed payments automatically.
          </h2>

          <div className="p-4 rounded-xl bg-[#081B2B] border border-[#143C5C] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase font-bold">
              <span>PROBLEM STATEMENT</span>
              <span className="text-cyan-400">REVIVE SOLUTION</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Merchants lose significant revenue every day to transient bank switch glitches, expired cards, and checkout abandonment. Revive reads 200+ signals per payment to execute retries at peak liquidity windows.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Razorpay & Chargebee Webhooks Integration</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>200+ ML Signals Timing & Cascading Engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Ramp-Grade Policy Gates & Operator Approvals</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card with 1-Click Demo Personas */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#081826]/95 border border-[#163E5C] shadow-2xl shadow-black/80 backdrop-blur-xl">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-[#163E5C] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {authMode === "signin" ? "Sign in to RevivePay" : "Create Revive Account"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Enterprise Autonomous Revenue Operating System</p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex p-1 rounded-lg bg-[#051420] border border-[#13354E] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    authMode === "signin"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    authMode === "signup"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* 1-Click Demo Persona Login Section */}
            <div className="p-3.5 rounded-xl bg-[#0A2033] border border-[#194668] space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1-Click Demo Persona Login</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Instant Access</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("MERCHANT_OWNER", "owner@revivepay.ai", "Aditya Sengupta")}
                  className="p-2.5 rounded-lg bg-[#061724] hover:bg-[#0B253A] text-left border border-[#153B57] hover:border-cyan-500/50 transition-all group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-300">Aditya Sengupta</p>
                  <p className="text-[10px] text-slate-400 font-mono">Merchant Owner</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("REVENUE_OPERATOR", "operator@revivepay.ai", "Rohan Deshmukh")}
                  className="p-2.5 rounded-lg bg-[#061724] hover:bg-[#0B253A] text-left border border-[#153B57] hover:border-cyan-500/50 transition-all group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-300">Rohan Deshmukh</p>
                  <p className="text-[10px] text-cyan-400 font-mono">Revenue Operator</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("SUPPORT_OPERATOR", "support@revivepay.ai", "Sneha Kulkarni")}
                  className="p-2.5 rounded-lg bg-[#061724] hover:bg-[#0B253A] text-left border border-[#153B57] hover:border-cyan-500/50 transition-all group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-300">Sneha Kulkarni</p>
                  <p className="text-[10px] text-slate-400 font-mono">Support Operator</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("ADMIN", "admin@revivepay.ai", "Harsh Chavan")}
                  className="p-2.5 rounded-lg bg-[#061724] hover:bg-[#0B253A] text-left border border-[#153B57] hover:border-cyan-500/50 transition-all group"
                >
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-300">Harsh Chavan</p>
                  <p className="text-[10px] text-purple-400 font-mono">Admin / Lead</p>
                </button>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-[#051420] border border-[#163E5C] text-slate-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full bg-[#051420] border border-[#163E5C] text-slate-100 rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Password</label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => alert("Password reset instructions sent to your email.")}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-[#051420] border border-[#163E5C] text-slate-100 rounded-lg pl-10 pr-10 py-2.5 outline-none focus:border-cyan-400 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Organization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#051420] border border-[#163E5C] text-slate-100 rounded-lg px-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
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

            <div className="mt-5 pt-4 border-t border-[#163E5C] text-center text-xs text-slate-400">
              <span>Want to test without signing in? </span>
              <Link to="/cases/RV-10291" className="text-cyan-400 font-semibold hover:underline">
                Explore Live Demo Case RV-10291 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between text-xs text-slate-500 z-10 py-2 border-t border-[#133248]/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SOC-2 Type II Certified · PCI-DSS Level 1 · 256-bit TLS</span>
        </div>
        <p>© 2026 RevivePay AI Inc. All rights reserved.</p>
      </div>
    </div>
  );
};
