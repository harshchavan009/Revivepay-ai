import React, { useState } from "react";
import { History, Shield, BrainCircuit, Sliders, PlayCircle, CheckCircle2, ChevronDown, ChevronRight, User, AlertTriangle, XCircle, CheckCheck } from "lucide-react";
import { AuditLogEntry } from "../../types";
import { EventSourceBadge } from "../EventSourceBadge";

interface AuditTimelineViewProps {
  logs: AuditLogEntry[];
}

export const AuditTimelineView: React.FC<AuditTimelineViewProps> = ({ logs }) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getEventBadge = (event_type: string) => {
    if (event_type.includes("verified") || event_type.includes("approved") || event_type.includes("policy.passed")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (event_type.includes("failed") || event_type.includes("rejected")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (event_type.includes("escalated") || event_type.includes("policy.blocked")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    if (event_type.includes("ai.") || event_type.includes("action.recommended")) {
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    }
    if (event_type.includes("approval.requested")) {
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const getActorIcon = (actor: string, event_type: string) => {
    if (event_type.includes("verified")) return <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />;
    if (event_type.includes("escalated")) return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    if (event_type.includes("failed") || event_type.includes("rejected")) return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    if (actor.includes("Risk")) return <Shield className="w-3.5 h-3.5 text-amber-400" />;
    if (actor.includes("AI") || actor.includes("Agent")) return <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />;
    if (actor.includes("Policy")) return <Sliders className="w-3.5 h-3.5 text-emerald-400" />;
    if (actor.includes("Operator") || actor.includes("Human")) return <User className="w-3.5 h-3.5 text-blue-400" />;
    return <PlayCircle className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Chronological Audit & Governance Trail</h3>
            <p className="text-[11px] text-slate-400">Canonical Tamper-Evident Event Taxonomy</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">{logs.length} Events Logged</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {logs.map((log, idx) => {
          const isExpanded = !!expandedIndices[idx];
          const hasDetails = !!log.input_data || !!log.decision;
          const eventType = log.event_type || log.action;

          return (
            <div key={log.id || log.audit_id || idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0B0F19] border border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                {getActorIcon(log.actor, eventType)}
              </div>

              {/* Event Card */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${getEventBadge(eventType)}`}>
                      {eventType}
                    </span>
                    <EventSourceBadge source={log.source} size="sm" />
                    <span className="text-slate-400 font-medium">{log.actor}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()} IST
                  </span>
                </div>

                {log.notes && <p className="text-slate-300 leading-normal">{log.notes}</p>}

                {/* Expandable Payload Inspector */}
                {hasDetails && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isExpanded ? "Hide Event Payload" : "View Event Payload"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-2">
                        {log.input_data && (
                          <div>
                            <span className="text-slate-500 font-bold block mb-1">Input Parameters:</span>
                            <pre className="text-emerald-400">{JSON.stringify(log.input_data, null, 2)}</pre>
                          </div>
                        )}
                        {log.decision && (
                          <div>
                            <span className="text-slate-500 font-bold block mb-1">Event Decision Output:</span>
                            <pre className="text-blue-400">{JSON.stringify(log.decision, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
