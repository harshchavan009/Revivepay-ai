import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DashboardMetrics } from "../types";
import { dashboardService, authService } from "../services";

const ZERO_METRICS: DashboardMetrics = {
  revenue_at_risk: 0,
  recovered_revenue: 0,
  recovery_rate: 0,
  failed_payments_count: 0,
  active_recovery_count: 0,
  escalated_cases_count: 0,
  awaiting_approval_count: 0,
  total_cases_count: 0,
  average_recovery_time_minutes: 0,
  retry_success_rate: 0,
  autonomous_recovery_rate: 0,
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
  const [metrics, setMetrics] = useState<DashboardMetrics>(ZERO_METRICS);
  const [environmentLabel, setEnvironmentLabel] = useState<string>("Sandbox Environment — Razorpay Test Mode");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const [data, env] = await Promise.all([
        dashboardService.getSummary(),
        authService.getEnvironment().catch(() => null)
      ]);
      if (data && typeof data.recovered_revenue === "number") {
        setMetrics(data);
        setIsLiveSynced(true);
        setLastSyncedAt(new Date());
      }
      if (env?.environment_label) {
        setEnvironmentLabel(env.environment_label);
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

