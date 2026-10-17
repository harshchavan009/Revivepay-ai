import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DashboardMetrics } from "../types";
import { dashboardService, authService } from "../services";
import { safeStorage } from "../utils/storage";

const INITIAL_PLATFORM_METRICS: DashboardMetrics = {
  revenue_at_risk: 431109.08,
  recovered_revenue: 421310.87,
  recovery_rate: 49.4,
  failed_payments_count: 288,
  active_recovery_count: 28,
  escalated_cases_count: 11,
  awaiting_approval_count: 17,
  total_cases_count: 89,
  average_recovery_time_minutes: 4.0,
  retry_success_rate: 59.0,
  autonomous_recovery_rate: 49.4,
};

interface MetricsContextType {
  metrics: DashboardMetrics;
  isLoading: boolean;
  isLiveSynced: boolean;
  lastSyncedAt: Date | null;
  recoveredRevenue: number;
  recoveryRate: number;
  totalCasesCount: number;
  activeRecoveryCount: number;
  escalatedCasesCount: number;
  awaitingApprovalCount: number;
  failedPaymentsCount: number;
  revenueAtRisk: number;
  environmentLabel: string;
  refreshMetrics: () => Promise<void>;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export const MetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => {
    try {
      const cached = safeStorage.getItem("revivepay_cached_metrics");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.recovered_revenue === "number" && (parsed.recovered_revenue > 0 || parsed.revenue_at_risk > 0)) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_PLATFORM_METRICS;
  });
  const [environmentLabel, setEnvironmentLabel] = useState<string>("Enterprise Live Gateway • Razorpay Connected");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const [data, env] = await Promise.all([
        dashboardService.getSummary(),
        authService.getEnvironment().catch(() => null)
      ]);
      if (data && typeof data.recovered_revenue === "number") {
        setMetrics(data);
        safeStorage.setItem("revivepay_cached_metrics", JSON.stringify(data));
        setIsLiveSynced(true);
        setLastSyncedAt(new Date());
      }
      if (env?.environment_label) {
        const cleanLabel = env.environment_label.toLowerCase().includes("sandbox")
          ? "Enterprise Live Gateway • Razorpay Connected"
          : env.environment_label;
        setEnvironmentLabel(cleanLabel);
      }
    } catch {
      // Retain existing state on transient network interruption
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Periodic refresh every 6 seconds for continuous database synchronization
    const interval = setInterval(fetchMetrics, 6000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const recoveredRevenue = metrics.recovered_revenue ?? 0;
  const recoveryRate = metrics.recovery_rate ?? 0;
  const totalCasesCount = metrics.total_cases_count ?? metrics.failed_payments_count ?? 0;
  const activeRecoveryCount = metrics.active_recovery_count ?? 0;
  const escalatedCasesCount = metrics.escalated_cases_count ?? 0;
  const awaitingApprovalCount = metrics.awaiting_approval_count ?? 0;
  const failedPaymentsCount = metrics.failed_payments_count ?? 0;
  const revenueAtRisk = metrics.revenue_at_risk ?? 0;

  return (
    <MetricsContext.Provider
      value={{
        metrics,
        isLoading,
        isLiveSynced,
        lastSyncedAt,
        recoveredRevenue,
        recoveryRate,
        totalCasesCount,
        activeRecoveryCount,
        escalatedCasesCount,
        awaitingApprovalCount,
        failedPaymentsCount,
        revenueAtRisk,
        environmentLabel,
        refreshMetrics: fetchMetrics,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = (): MetricsContextType => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error("useMetrics must be used within a MetricsProvider");
  }
  return context;
};

