import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, switchPersona, isLoading } = useAuth();
  const [email, setEmail] = useState("operator@revivepay.ai");
  const [password, setPassword] = useState("password123");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    navigate("/dashboard");
  };

  const handleQuickLogin = (role: UserRole, demoEmail: string) => {
    switchPersona(role);
    setEmail(demoEmail);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-blue-900/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Sign in to RevivePay AI</h2>
          <p className="text-xs text-slate-400">Autonomous Revenue Recovery Operating System</p>
        </div>

        {/* Quick Demo Persona Login */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>1-Click Demo Persona Login</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin("MERCHANT_OWNER", "owner@revivepay.ai")}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition-colors"
            >
              <p className="font-semibold text-slate-200">Aditya Sengupta</p>
              <p className="text-[10px] text-slate-400 font-mono">Merchant Owner</p>
            </button>
            <button
              onClick={() => handleQuickLogin("REVENUE_OPERATOR", "operator@revivepay.ai")}
              className="p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 text-left border border-blue-500/30 transition-colors"
            >
              <p className="font-semibold text-blue-300">Rohan Deshmukh</p>
              <p className="text-[10px] text-blue-400 font-mono">Revenue Operator</p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-blue-500 font-sans"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-blue-500 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <span>{isLoading ? "Signing in..." : "Sign in to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Want to explore first?{" "}
          <Link to="/cases/RV-10291" className="text-blue-400 hover:underline">
            View Killer Demo Case
          </Link>
        </p>
      </div>
    </div>
  );
};
