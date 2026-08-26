import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Zap,
  Bell,
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GlobalSearchModal } from "./GlobalSearchModal";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-xs">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 w-80">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all text-xs font-medium group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Search cases, pay IDs, clients...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-slate-200 text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Status Indicators & Databox / Service Dropdown */}
        <div className="flex items-center gap-3">
          {/* Databox Selector (From Image 2) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Databox Intelligence</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Autonomous Engine Live Status */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Autonomous Engine: Active</span>
          </div>

          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => navigate("/simulation")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate Failure</span>
          </button>

          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white flex items-center justify-center relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600"></span>
          </Link>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
