import React, { useState } from "react";
import { History, Shield, BrainCircuit, Sliders, PlayCircle, CheckCircle2, ChevronDown, ChevronRight, User, AlertTriangle, XCircle, CheckCheck } from "lucide-react";
import { AuditLogEntry } from "../../types";
import { EventSourceBadge } from "../EventSourceBadge";
import { formatTimeSafe } from "../../utils/dateUtils";

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
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
    if (event_type.includes("failed") || event_type.includes("rejected")) {
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
    }
    if (event_type.includes("escalated") || event_type.includes("policy.blocked")) {
      return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30";
    }
    if (event_type.includes("ai.") || event_type.includes("action.recommended")) {
      return "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)]";
    }
    return "bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]";
  };

  const getActorIcon = (actor: string, event_type: string) => {
    if (event_type.includes("verified")) return <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />;
    if (event_type.includes("escalated")) return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    if (event_type.includes("failed") || event_type.includes("rejected")) return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    if (actor.includes("Risk")) return <Shield className="w-3.5 h-3.5 text-amber-500" />;
    if (actor.includes("AI") || actor.includes("Agent")) return <BrainCircuit className="w-3.5 h-3.5 text-[var(--color-accent)]" />;
    if (actor.includes("Policy")) return <Sliders className="w-3.5 h-3.5 text-emerald-500" />;
    if (actor.includes("Operator") || actor.includes("Human")) return <User className="w-3.5 h-3.5 text-indigo-500" />;
    return <PlayCircle className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />;
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-premium-sm space-y-5 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--color-bg-canvas)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Chronological Audit & Governance Trail</h3>
            <p className="text-[11px] text-[var(--color-text-secondary)]">Canonical Tamper-Evident Event Taxonomy</p>
          </div>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{logs.length} Events Logged</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border-subtle)]">
        {logs.map((log, idx) => {
          const isExpanded = !!expandedIndices[idx];
          const hasDetails = !!log.input_data || !!log.decision;
          const eventType = log.event_type || log.action;

          return (
            <div key={log.id || log.audit_id || idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-accent)] transition-colors shadow-sm">
                {getActorIcon(log.actor, eventType)}
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${getEventBadge(eventType)}`}>
                      {eventType}
                    </span>
                    <EventSourceBadge source={log.source} size="sm" />
                    <span className="text-[var(--color-text-secondary)] font-semibold">{log.actor}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {formatTimeSafe(log.timestamp)} IST
                  </span>
                </div>

                {log.notes && <p className="text-[var(--color-text-secondary)] leading-relaxed">{log.notes}</p>}

                {/* Expandable Payload Inspector */}
                {hasDetails && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline font-mono cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isExpanded ? "Hide Event Payload" : "View Event Payload"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] font-mono text-[11px] text-[var(--color-text-secondary)] overflow-x-auto space-y-2">
                        {log.input_data && (
                          <div>
                            <span className="text-[var(--color-text-muted)] font-bold block mb-1">Input Parameters:</span>
                            <pre className="text-emerald-600 dark:text-emerald-400">{JSON.stringify(log.input_data, null, 2)}</pre>
                          </div>
                        )}
                        {log.decision && (
                          <div>
                            <span className="text-[var(--color-text-muted)] font-bold block mb-1">Event Decision Output:</span>
                            <pre className="text-[var(--color-accent)]">{JSON.stringify(log.decision, null, 2)}</pre>
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
