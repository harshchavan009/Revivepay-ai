import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Binary,
  BarChart2,
  Target,
  PlayCircle,
  Database,
  Sparkles,
  Activity,
  Clock,
  Users,
  Award,
  LifeBuoy,
  Settings,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const iconNavItems = [
    { label: "Dashboard Overview", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Key Metrics (123)", icon: Binary, path: "/analytics" },
    { label: "Performance Intelligence", icon: BarChart2, path: "/dashboard" },
    { label: "Goal Tracking", icon: Target, path: "/simulation" },
    { label: "Video Scenarios", icon: PlayCircle, path: "/simulation" },
    { label: "Data Sources", icon: Database, path: "/payments" },
    { label: "AI Insights", icon: Sparkles, path: "/ai-activity" },
    { label: "Live Activity", icon: Activity, path: "/ai-activity" },
    { label: "History & Logs", icon: Clock, path: "/audit" },
    { label: "User Audience", icon: Users, path: "/cases" },
    { label: "Compliance & Badges", icon: Award, path: "/policy" },
    { label: "Help & Support", icon: LifeBuoy, path: "/settings" },
  ];

  return (
    <aside className="w-16 bg-white border-r border-slate-200/90 flex flex-col items-center justify-between py-4 h-screen select-none shrink-0 z-30 shadow-2xs">
      {/* Top Databox Blue Icon Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-xl bg-[#0088FF] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 hover:scale-105 transition-transform"
          title="Databox Intelligence"
        >
          <BarChart2 className="w-6 h-6" />
        </Link>

        {/* Vertical Icon List */}
        <nav className="flex flex-col items-center gap-1.5 w-full px-2">
          {iconNavItems.map((item, index) => {
            const isActive = location.pathname === item.path && index <= 2;
            const Icon = item.icon;
            return (
              <Link
                key={index}
                to={item.path}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
                  isActive
                    ? "bg-slate-100 text-[#0088FF] font-bold shadow-2xs"
                    : index === 10
                    ? "text-[#10B981] hover:bg-emerald-50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip on Hover */}
                <div className="absolute left-14 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Photo Avatar (Matching Image 2) */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          title={user?.name || "Steve (Account Owner)"}
          className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-700 font-bold text-xs cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
            alt="Steve Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </aside>
  );
};
