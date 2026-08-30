import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] flex items-center justify-center p-6 text-[var(--color-text-primary)] font-sans transition-colors">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-6 shadow-premium-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center mx-auto text-[var(--color-accent)]">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-[var(--color-accent)] font-bold uppercase tracking-widest">
            ERROR 404 · PAGE NOT FOUND
          </span>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Endpoint Unreachable</h1>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            The requested telemetry route does not exist or has been relocated within the RevivePay engine.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/dashboard"
            className="flex-1 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </Link>
          <Link
            to="/"
            className="flex-1 py-2.5 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
