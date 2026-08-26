import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Search, Filter, RefreshCw, ArrowRight, PlayCircle, Zap, FlaskConical } from "lucide-react";
import { recoveryService } from "../services";
import { RecoveryCase } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";
import { ActionBadge } from "../components/ActionBadge";
import { EventSourceBadge } from "../components/EventSourceBadge";
import { formatINR } from "../data/mockData";

export const RecoveryCasesPage: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL"); // ALL, RAZORPAY_TEST, SIMULATION
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await recoveryService.getCases({
        status: statusFilter,
        search: search.trim() || undefined
      });
      setCases(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  const filteredCases = cases.filter((c) => {
    if (sourceFilter === "ALL") return true;
    if (sourceFilter === "RAZORPAY_TEST") return c.source === "RAZORPAY_TEST" || !c.source;
    if (sourceFilter === "SIMULATION") return c.source === "SIMULATION";
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#13354E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              CASE INVESTIGATION QUEUE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {filteredCases.length} Cases Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span>Recovery Case Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous queue with strict event provenance tracking between Real Gateway Test Events and Synthetic Simulations.
          </p>
        </div>

        <button
          onClick={loadCases}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#081B2A] border border-[#163E5C] hover:bg-[#0D283E] text-slate-200 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Provenance Segment Bar */}
      <div className="p-4 rounded-2xl bg-[#081826]/90 border border-[#163E5C] space-y-3 shadow-xl">
        {/* Source Provenance Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#163E5C]/80 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Event Provenance:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSourceFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                sourceFilter === "ALL"
                  ? "bg-[#0B253A] text-cyan-300 border-cyan-500/50 shadow-sm"
                  : "bg-[#051420] text-slate-400 border-[#143952] hover:text-slate-200"
              }`}
            >
              All Events ({cases.length})
            </button>
            <button
              onClick={() => setSourceFilter("RAZORPAY_TEST")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                sourceFilter === "RAZORPAY_TEST"
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm"
                  : "bg-[#051420] text-slate-400 border-[#143952] hover:text-cyan-400"
              }`}
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Razorpay Test ({cases.filter((c) => c.source !== "SIMULATION").length})</span>
            </button>
            <button
              onClick={() => setSourceFilter("SIMULATION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                sourceFilter === "SIMULATION"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm"
                  : "bg-[#051420] text-slate-400 border-[#143952] hover:text-purple-400"
              }`}
            >
              <FlaskConical className="w-3 h-3 text-purple-400" />
              <span>Simulation ({cases.filter((c) => c.source === "SIMULATION").length})</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Case ID (RV-10291), customer name, or root cause..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#051420] border border-[#163E5C] text-slate-200 text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-cyan-400 font-sans"
            />
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "AWAITING_APPROVAL", "ACTION_RECOMMENDED", "RECOVERED", "ESCALATED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  statusFilter === st
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                    : "bg-[#051420] text-slate-400 border-[#143952] hover:text-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Cases Table */}
      <div className="bg-[#081826]/90 border border-[#163E5C] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#051420] border-b border-[#163E5C] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Case ID</th>
                <th className="p-4">Provenance</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount (INR)</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Root Cause</th>
                <th className="p-4">Action</th>
                <th className="p-4">Policy Status</th>
                <th className="p-4">Recovery Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13354E]/60">
              {filteredCases.map((c) => (
                <tr key={c.case_id || c.id} className="hover:bg-[#0A2234]/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-white">
                    <Link to={`/cases/${c.case_id}`} className="hover:text-cyan-400 flex items-center gap-1.5">
                      {c.case_id}
                      {c.case_id === "RV-10291" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          DEMO
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="p-4">
                    <EventSourceBadge source={c.source} size="sm" />
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{c.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.customer_tier || "STANDARD"}</p>
                  </td>
                  <td className="p-4 font-bold text-white">
                    {formatINR(c.amount ?? c.amount_at_risk ?? 0)}
                  </td>
                  <td className="p-4">
                    <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                  </td>
                  <td className="p-4 font-medium text-slate-300 max-w-[160px] truncate">
                    {c.root_cause || c.failure_type}
                  </td>
                  <td className="p-4">
                    <ActionBadge action={c.recommended_action} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={c.policy_status} type="policy" />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={c.recovery_status} />
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/cases/${c.case_id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#0A2234] hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold text-[11px] transition-colors inline-block"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
