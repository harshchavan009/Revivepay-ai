import { apiClient } from "./api";
import {
  DashboardMetrics,
  Payment,
  RecoveryCase,
  PolicyConfig,
  SubscriptionItem,
  AbandonedCart,
  AuditLogEntry,
  SimulationPreset,
  SimulationResult,
  User
} from "../types";
import { initialDashboardMetrics, initialCases } from "../data/cases";

export const authService = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.data.access_token) {
      localStorage.setItem("revivepay_token", res.data.access_token);
      localStorage.setItem("revivepay_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (name: string, email: string, password: string, role: string): Promise<User> => {
    const res = await apiClient.post("/auth/register", { name, email, password, role });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("revivepay_token");
    localStorage.removeItem("revivepay_user");
  }
};

export const dashboardService = {
  getSummary: async (): Promise<DashboardMetrics> => {
    try {
      const res = await apiClient.get<DashboardMetrics>("/dashboard/summary");
      return res.data;
    } catch {
      return initialDashboardMetrics;
    }
  },
  getRevenueRiskTrend: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get("/dashboard/revenue-risk");
      return res.data;
    } catch {
      return [
        { date: "Mon", revenue_at_risk: 74500, recovered_revenue: 42000, rate: 56.3 },
        { date: "Tue", revenue_at_risk: 82000, recovered_revenue: 51000, rate: 62.1 },
        { date: "Wed", revenue_at_risk: 91000, recovered_revenue: 48500, rate: 53.2 },
        { date: "Thu", revenue_at_risk: 68000, recovered_revenue: 39000, rate: 57.3 },
        { date: "Fri", revenue_at_risk: 115000, recovered_revenue: 72000, rate: 62.6 },
        { date: "Sat", revenue_at_risk: 53000, recovered_revenue: 31000, rate: 58.4 },
        { date: "Sun", revenue_at_risk: 49000, recovered_revenue: 29800, rate: 60.8 },
      ];
    }
  },
  getFailureReasons: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get("/dashboard/failure-reasons");
      return res.data;
    } catch {
      return [
        { category: "temporary_bank_failure", label: "Bank Gateway Disconnect", count: 142, amount: 215000 },
        { category: "insufficient_funds", label: "Insufficient Balance", count: 89, amount: 132000 },
        { category: "checkout_drop", label: "Abandoned Checkout", count: 54, amount: 84500 },
        { category: "card_expired", label: "Card Expired / Token Void", count: 41, amount: 51000 },
      ];
    }
  },
  getFunnel: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get("/dashboard/funnel");
      return res.data;
    } catch {
      return [
        { stage: "1. Failure Detected", count: 326, dropoff: "0%" },
        { stage: "2. AI Diagnosed", count: 294, dropoff: "9.8%" },
        { stage: "3. Policy Validated", count: 248, dropoff: "15.6%" },
        { stage: "4. Action Dispatched", count: 210, dropoff: "15.3%" },
        { stage: "5. Revenue Recovered", count: 147, dropoff: "30.0%" }
      ];
    }
  }
};

export const paymentService = {
  getPayments: async (params?: { status?: string; failure_category?: string; search?: string; limit?: number; offset?: number }): Promise<Payment[]> => {
    try {
      const res = await apiClient.get<Payment[]>("/payments", { params });
      return res.data;
    } catch {
      return [];
    }
  },
  getPaymentById: async (id: string): Promise<Payment | null> => {
    try {
      const res = await apiClient.get<Payment>(`/payments/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }
};

export const recoveryService = {
  getCases: async (params?: { status?: string; risk_level?: string; approval_status?: string; search?: string; limit?: number; offset?: number }): Promise<RecoveryCase[]> => {
    try {
      const res = await apiClient.get<RecoveryCase[]>("/recovery/cases", { params });
      return res.data;
    } catch {
      return initialCases;
    }
  },
  getCaseById: async (caseId: string): Promise<RecoveryCase | null> => {
    try {
      const res = await apiClient.get<RecoveryCase>(`/recovery/cases/${caseId}`);
      return res.data;
    } catch {
      const found = initialCases.find(c => c.id === caseId || c.case_id === caseId);
      return found || null;
    }
  },
  analyzeCase: async (caseId: string): Promise<RecoveryCase> => {
    const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/analyze`);
    return res.data;
  },
  approveCase: async (caseId: string, notes?: string): Promise<RecoveryCase> => {
    const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/approve`, { action: "APPROVE", notes });
    return res.data;
  },
  rejectCase: async (caseId: string, rejection_reason: string, notes?: string): Promise<RecoveryCase> => {
    const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/reject`, { action: "REJECT", rejection_reason, notes });
    return res.data;
  },
  executeAction: async (caseId: string): Promise<any> => {
    const res = await apiClient.post(`/recovery/${caseId}/execute`);
    return res.data;
  },
  stopRecovery: async (caseId: string): Promise<RecoveryCase> => {
    const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/stop`);
    return res.data;
  }
};

export const policyService = {
  getConfig: async (): Promise<PolicyConfig> => {
    try {
      const res = await apiClient.get<PolicyConfig>("/policy/config");
      return res.data;
    } catch {
      return {
        id: "pol_default",
        merchant_id: "m_default",
        max_auto_retries: 2,
        max_auto_amount: 10000.0,
        high_value_approval_threshold: 50000.0,
        min_ai_confidence: 0.85,
        allow_customer_contact: true,
        recovery_time_window_hours: 72,
        allowed_actions: [
          "retry_payment",
          "create_payment_link",
          "send_customer_notification",
          "trigger_checkout_reminder",
          "request_payment_method_update",
          "escalate_to_merchant",
          "stop_recovery"
        ],
        updated_at: new Date().toISOString()
      };
    }
  },
  updateConfig: async (config: Partial<PolicyConfig>): Promise<PolicyConfig> => {
    const res = await apiClient.put<PolicyConfig>("/policy/config", config);
    return res.data;
  }
};

export const subscriptionService = {
  getSubscriptions: async (): Promise<SubscriptionItem[]> => {
    try {
      const res = await apiClient.get<SubscriptionItem[]>("/subscriptions");
      return res.data;
    } catch {
      return [];
    }
  },
  retrySubscription: async (subId: string): Promise<any> => {
    const res = await apiClient.post(`/subscriptions/${subId}/retry`);
    return res.data;
  }
};

export const checkoutService = {
  getAbandonedCheckouts: async (): Promise<AbandonedCart[]> => {
    try {
      const res = await apiClient.get<AbandonedCart[]>("/checkout/abandoned");
      return res.data;
    } catch {
      return [];
    }
  },
  recoverCheckout: async (chkId: string): Promise<any> => {
    const res = await apiClient.post(`/checkout/${chkId}/recover`);
    return res.data;
  }
};

export const auditService = {
  getLogs: async (params?: { case_id?: string; action?: string; actor?: string; limit?: number; offset?: number }): Promise<AuditLogEntry[]> => {
    try {
      const res = await apiClient.get<AuditLogEntry[]>("/audit", { params });
      return res.data;
    } catch {
      return [];
    }
  },
  getCaseAuditLogs: async (caseId: string): Promise<AuditLogEntry[]> => {
    try {
      const res = await apiClient.get<AuditLogEntry[]>(`/audit/${caseId}`);
      return res.data;
    } catch {
      return [];
    }
  }
};

export const simulationService = {
  getPresets: async (): Promise<SimulationPreset[]> => {
    try {
      const res = await apiClient.get<SimulationPreset[]>("/simulation/presets");
      return res.data;
    } catch {
      return [];
    }
  },
  triggerSimulation: async (scenario: string, amount?: number, customerType?: string, paymentMethod?: string): Promise<SimulationResult> => {
    const res = await apiClient.post<SimulationResult>("/simulation/trigger", {
      scenario,
      amount,
      customer_type: customerType,
      payment_method: paymentMethod
    });
    return res.data;
  }
};
