/**
 * RevivePay Error Tracking & Diagnostic Telemetry Instrumentation
 * Gracefully integrates with Sentry (when VITE_SENTRY_DSN is configured)
 * and maintains an in-memory client diagnostics breadcrumb log.
 */

interface ErrorBreadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: "info" | "warning" | "error";
  data?: any;
}

class ErrorTracker {
  private dsn: string | undefined;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    this.dsn = import.meta.env.VITE_SENTRY_DSN;
    this.isInitialized = true;

    // Window global error handler
    window.addEventListener("error", (event) => {
      this.captureException(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.captureException(event.reason || new Error("Unhandled Promise Rejection"), {
        type: "unhandledrejection"
      });
    });

    this.addBreadcrumb("init", "Error tracking & client telemetry initialized", "info");
  }

  public addBreadcrumb(category: string, message: string, level: "info" | "warning" | "error" = "info", data?: any) {
    const crumb: ErrorBreadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data
    };
    this.breadcrumbs.push(crumb);
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  public captureException(error: Error | any, extraContext?: Record<string, any>) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      name: error?.name || "Error",
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: extraContext,
      breadcrumbs: [...this.breadcrumbs]
    };

    console.error("[RevivePay ErrorTracker] Captured Exception:", errorReport);

    // If Sentry DSN is configured, dispatch telemetry
    if (this.dsn) {
      try {
        fetch(this.dsn, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorReport)
        }).catch(() => {});
      } catch {
        // Safe fallback
      }
    }

    return errorReport;
  }

  public captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    this.addBreadcrumb("custom_message", message, level);
    console.warn(`[RevivePay ErrorTracker] [${level.toUpperCase()}]:`, message);
  }

  public getBreadcrumbs(): ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }
}

export const errorTracker = new ErrorTracker();
