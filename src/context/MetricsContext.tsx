import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DashboardMetrics } from "../types";
import { dashboardService, authService } from "../services";
import { SHARED_METRICS } from "../data/mockData";

interface MetricsContextType {
  metrics: DashboardMetrics;
  isLoading: boolean;
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
  const [metrics, setMetrics] = useState<DashboardMetrics>(SHARED_METRICS);
  const [environmentLabel, setEnvironmentLabel] = useState<string>("Sandbox Environment — Razorpay Test Mode");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const [data, env] = await Promise.all([
        dashboardService.getSummary(),
        authService.getEnvironment().catch(() => null)
      ]);
      if (data && typeof data.recovered_revenue === "number") {
        setMetrics(data);
      }
      if (env?.environment_label) {
        setEnvironmentLabel(env.environment_label);
      }
    } catch {
      // Keep existing metrics on network jitter
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Periodic refresh every 8 seconds for live dashboard synchronization
    const interval = setInterval(fetchMetrics, 8000);
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
