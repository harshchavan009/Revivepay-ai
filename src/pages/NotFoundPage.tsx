import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home, ShieldAlert } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#041018] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#081826]/90 border border-[#163E5C] text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest">
            ERROR 404 · PAGE NOT FOUND
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Endpoint Unreachable</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested telemetry route does not exist or has been relocated within the RevivePay engine.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/dashboard"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </Link>
          <Link
            to="/"
            className="flex-1 py-2.5 rounded-xl bg-[#0B253A] border border-[#163E5C] hover:bg-[#10334E] text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
