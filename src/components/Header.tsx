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
  ChevronDown,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GlobalSearchModal } from "./GlobalSearchModal";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-[#051420]/95 border-b border-[#13354E] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg backdrop-blur-md">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 w-80">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] text-slate-400 hover:text-slate-200 hover:border-cyan-500/50 transition-all text-xs font-medium group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span>Search cases, TXNs, customers...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-[#051420] border border-[#163E5C] text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Status Indicators & Action Triggers */}
        <div className="flex items-center gap-3">
          {/* Autonomous Engine Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081E2F] border border-[#164567] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Autonomous Retries:</span>
            <span className="text-cyan-400 font-bold">65.2% Rate</span>
          </div>

          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => navigate("/simulation")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate Failure</span>
          </button>

          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="w-9 h-9 rounded-xl bg-[#081B2A] border border-[#163E5C] text-slate-300 hover:text-white hover:bg-[#0D2A40] flex items-center justify-center relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
          </Link>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
