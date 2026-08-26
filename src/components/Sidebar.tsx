import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Clock,
  Lock,
  Settings,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Zap,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const navGroups = [
    {
      group: "REVENUE RECOVERY",
      items: [
        { label: "Executive Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Recovery Cases", icon: ShieldCheck, path: "/cases", badge: "28" },
        { label: "Approval Center", icon: CheckCircle2, path: "/approvals", badge: "3", badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
        { label: "Simulation Lab", icon: PlayCircle, path: "/simulation" },
      ]
    },
    {
      group: "BILLING & LEDGER",
      items: [
        { label: "Payments Telemetry", icon: CreditCard, path: "/payments" },
        { label: "Subscription Dunning", icon: RefreshCw, path: "/subscriptions" },
        { label: "Checkout Recovery", icon: ShoppingCart, path: "/checkout" },
        { label: "Revenue Analytics", icon: BarChart3, path: "/analytics" },
      ]
    },
    {
      group: "AI & GOVERNANCE",
      items: [
        { label: "200+ ML Signals Feed", icon: Sparkles, path: "/ai-activity" },
        { label: "Immutable Audit Log", icon: Clock, path: "/audit" },
        { label: "Policy Guardrails", icon: Lock, path: "/policies" },
        { label: "Gateway & Webhooks", icon: Settings, path: "/settings" },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#051420] border-r border-[#13354E] flex flex-col justify-between py-4 select-none shrink-0 z-30 font-sans shadow-2xl">
      {/* Top Section: Brand Header & Navigation */}
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Logo (Matching Reference Photos) */}
        <div className="px-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF5E3A] via-[#FF7A59] to-[#FFA07A] flex items-center justify-center shadow-lg shadow-orange-950/40 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 leading-none">
                <span>revive</span>
                <span className="text-cyan-400 text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-cyan-950 border border-cyan-500/30">
                  AI
                </span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                OPERATING SYSTEM
              </span>
            </div>
          </Link>

          <Link
            to="/"
            title="View Public Website"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#092233] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-230px)]">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="px-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {group.group}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item, iIdx) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === "/cases" && location.pathname.startsWith("/cases")) ||
                    (item.path === "/policies" && location.pathname === "/policy");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={iIdx}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#0B253A] text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40"
                          : "text-slate-300 hover:text-white hover:bg-[#081B2B]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "text-cyan-400" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            item.badgeColor || "bg-cyan-950 text-cyan-400 border-cyan-500/30 font-bold"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Persona Switcher & User Profile */}
      <div className="px-3 pt-3 border-t border-[#13354E]/80 space-y-2">
        {/* Active Gateway Connection Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-[#081C2C] border border-[#143B57] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Razorpay · LIVE</span>
          </div>
          <span className="text-[10px] text-slate-400">200+ ML On</span>
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#081B2A] hover:bg-[#0D283E] border border-[#163E5C] text-left transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0">
                {user?.name ? user.name[0] : "R"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || "Rohan Deshmukh"}</p>
                <p className="text-[10px] text-cyan-400 font-mono truncate">
                  {user?.role?.replace("_", " ") || "REVENUE OPERATOR"}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
          </button>

          {/* Persona Selection Menu */}
          {showPersonaMenu && (
            <div className="absolute bottom-12 left-0 right-0 p-2 rounded-xl bg-[#061826] border border-[#163E5C] shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Switch Demo Persona
              </div>
              {[
                { role: "MERCHANT_OWNER" as UserRole, name: "Aditya Sengupta", desc: "Merchant Owner" },
                { role: "REVENUE_OPERATOR" as UserRole, name: "Rohan Deshmukh", desc: "Revenue Operator" },
                { role: "SUPPORT_OPERATOR" as UserRole, name: "Sneha Kulkarni", desc: "Support Operator" },
                { role: "ADMIN" as UserRole, name: "Harsh Chavan", desc: "System Admin" }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    switchPersona(p.role);
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex flex-col transition-colors ${
                    user?.role === p.role
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold"
                      : "text-slate-300 hover:bg-[#0A2234]"
                  }`}
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{p.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
