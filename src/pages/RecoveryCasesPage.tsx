import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Search, Filter, RefreshCw, ArrowRight, PlayCircle, Zap, FlaskConical } from "lucide-react";
import { recoveryService } from "../services";
import { RecoveryCase } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";
import { ActionBadge } from "../components/ActionBadge";
import { EventSourceBadge } from "../components/EventSourceBadge";

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Recovery Case Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous queue with strict event provenance tracking between Real Gateway Test Events and Synthetic Simulations.
          </p>
        </div>

        <button
          onClick={loadCases}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Provenance Segment Bar */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
        {/* Source Provenance Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Event Provenance:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSourceFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                sourceFilter === "ALL"
                  ? "bg-slate-800 text-slate-100 border-slate-600 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              All Events ({cases.length})
            </button>
            <button
              onClick={() => setSourceFilter("RAZORPAY_TEST")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                sourceFilter === "RAZORPAY_TEST"
                  ? "bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm shadow-blue-950/40"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-blue-400"
              }`}
            >
              <Zap className="w-3 h-3 text-blue-400" />
              <span>Razorpay Test ({cases.filter((c) => c.source !== "SIMULATION").length})</span>
            </button>
            <button
              onClick={() => setSourceFilter("SIMULATION")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                sourceFilter === "SIMULATION"
                  ? "bg-amber-600/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-950/40"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-amber-400"
              }`}
            >
              <FlaskConical className="w-3 h-3 text-amber-400" />
              <span>Simulation ({cases.filter((c) => c.source === "SIMULATION").length})</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Case ID (RV-10291), root cause, or failure type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none font-sans"
            />
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "AWAITING_APPROVAL", "ACTION_RECOMMENDED", "RECOVERED", "ESCALATED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600/20 text-blue-400 border-blue-500 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Cases Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Case ID</th>
                <th className="p-3.5">Provenance / Source</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Amount (INR)</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5">AI Root Cause</th>
                <th className="p-3.5">Recommended Action</th>
                <th className="p-3.5">Policy Status</th>
                <th className="p-3.5">Recovery Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((c) => (
                <tr key={c.case_id || c.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-100">
                    <Link to={`/cases/${c.case_id}`} className="hover:text-blue-400 flex items-center gap-1.5">
                      {c.case_id}
                      {c.case_id === "RV-10291" && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          DEMO
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <EventSourceBadge source={c.source} size="sm" />
                  </td>
                  <td className="p-3.5">
                    <p className="font-medium text-slate-200">{c.customer_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.customer_tier || "STANDARD"}</p>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-amber-400">
                    ₹{(c.amount ?? c.amount_at_risk ?? 0).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <RiskBadge level={c.risk_level} score={c.risk_score} showScore />
                  </td>
                  <td className="p-3.5 font-medium text-slate-300 max-w-[150px] truncate">
                    {c.root_cause || c.failure_type}
                  </td>
                  <td className="p-3.5">
                    <ActionBadge action={c.recommended_action} />
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={c.policy_status} type="policy" />
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={c.recovery_status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      to={`/cases/${c.case_id}`}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-medium text-[11px] transition-colors"
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
