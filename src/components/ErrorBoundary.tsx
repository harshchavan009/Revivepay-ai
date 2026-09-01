import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { errorTracker } from "../utils/errorTracking";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack || "" });
    errorTracker.captureException(error, {
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-[var(--color-bg-surface)] border border-rose-500/30 rounded-2xl p-8 shadow-premium-lg text-center">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Something went wrong</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed font-mono">
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>
            {this.state.componentStack && (
              <details className="text-left mb-6 text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-canvas)] p-3 rounded-xl border border-[var(--color-border-subtle)] max-h-40 overflow-y-auto">
                <summary className="cursor-pointer font-bold text-rose-400 mb-1">Component Stack Trace</summary>
                <pre className="whitespace-pre-wrap">{this.state.componentStack}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold rounded-xl transition-all shadow-premium-sm flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
