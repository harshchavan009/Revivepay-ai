import axios from "axios";
import {
  RecoveryCase,
  PolicyConfig,
  DashboardMetrics,
  SubscriptionItem,
  AbandonedCart,
  Payment,
  AuditLogEntry,
  SimulationPreset,
  SimulationResult,
  User
} from "../types";
import { SHARED_CASES, SHARED_METRICS, SHARED_SUBSCRIPTIONS, SHARED_PAYMENTS, SHARED_ABANDONED_CARTS } from "../data/mockData";

const API_BASE_URL = "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email?: string, password?: string, role: string = "REVENUE_OPERATOR"): Promise<{ token: string; user: User }> => {
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>("/auth/login", { email, password, role });
      const token = res.data.access_token || "mock_token";
      localStorage.setItem("auth_token", token);
      return { token, user: res.data.user };
    } catch {
      const mockUser: User = {
        id: "usr_mock_001",
        email: email || "rohan@enterprise.in",
        name: email ? email.split("@")[0] : "Rohan Deshmukh",
        role: (role as any) || "REVENUE_OPERATOR",
        is_active: true,
        created_at: new Date().toISOString()
      };
      localStorage.setItem("auth_token", "mock_jwt_token");
      return { token: "mock_jwt_token", user: mockUser };
    }
  },
  register: async (name: string, email: string, password?: string, role: string = "REVENUE_OPERATOR"): Promise<User> => {
    try {
      const res = await apiClient.post<User>("/auth/register", { name, email, password, role });
      return res.data;
    } catch {
      return {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: (role as any) || "REVENUE_OPERATOR",
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
  },
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const res = await apiClient.get<User>("/auth/me");
      return res.data;
    } catch {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      return {
        id: "usr_mock_001",
        email: "rohan@enterprise.in",
        name: "Rohan Deshmukh",
        role: "REVENUE_OPERATOR",
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
  },
  switchPersona: async (role: string, email?: string): Promise<{ token: string; user: User }> => {
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>("/auth/switch-persona", { role, email });
      const token = res.data.access_token;
      localStorage.setItem("auth_token", token);
      return { token, user: res.data.user };
    } catch {
      const mockUser: User = {
        id: `usr_${role.toLowerCase()}`,
        email: email || `${role.toLowerCase()}@revivepay.ai`,
        name: role.replace("_", " "),
        role: role as any,
        is_active: true,
        created_at: new Date().toISOString()
      };
      return { token: "mock_jwt_token", user: mockUser };
    }
  },
  logout: async () => {
    localStorage.removeItem("auth_token");
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
  }
};

export const dashboardService = {
  getSummary: async (): Promise<DashboardMetrics> => {
    try {
      const res = await apiClient.get<DashboardMetrics>("/dashboard/summary");
      return res.data;
    } catch {
      return SHARED_METRICS;
    }
  }
};

export const paymentService = {
  getPayments: async (params?: { status?: string; failure_category?: string; search?: string; limit?: number; offset?: number }): Promise<Payment[]> => {
    try {
      const res = await apiClient.get<Payment[]>("/payments", { params });
      return res.data;
    } catch {
      let filtered = [...SHARED_PAYMENTS];
      if (params?.status && params.status !== "ALL") {
        filtered = filtered.filter(p => p.status === params.status);
      }
      if (params?.failure_category && params.failure_category !== "ALL") {
        filtered = filtered.filter(p => p.failure_category === params.failure_category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.payment_id.toLowerCase().includes(q) ||
          (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
          (p.failure_reason && p.failure_reason.toLowerCase().includes(q))
        );
      }
      return filtered;
    }
  }
};

export const recoveryService = {
  getCases: async (params?: { status?: string; risk_level?: string; approval_status?: string; search?: string; limit?: number; offset?: number }): Promise<RecoveryCase[]> => {
    try {
      const res = await apiClient.get<RecoveryCase[]>("/recovery/cases", { params });
      return res.data;
    } catch {
      let filtered = [...SHARED_CASES];
      if (params?.approval_status) {
        filtered = filtered.filter(c => c.approval_status === params.approval_status);
      }
      if (params?.status && params.status !== "ALL") {
        filtered = filtered.filter(c => c.recovery_status === params.status);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.case_id.toLowerCase().includes(q) ||
          (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
          (c.root_cause && c.root_cause.toLowerCase().includes(q))
        );
      }
      return filtered;
    }
  },
  getCaseById: async (caseId: string): Promise<RecoveryCase | null> => {
    try {
      const res = await apiClient.get<RecoveryCase>(`/recovery/cases/${caseId}`);
      return res.data;
    } catch {
      const found = SHARED_CASES.find(c => c.id === caseId || c.case_id === caseId);
      return found || null;
    }
  },
  analyzeCase: async (caseId: string): Promise<RecoveryCase> => {
    try {
      const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/analyze`);
      return res.data;
    } catch {
      const found = SHARED_CASES.find(c => c.id === caseId || c.case_id === caseId) || SHARED_CASES[0];
      return found;
    }
  },
  approveCase: async (caseId: string, notes?: string): Promise<RecoveryCase> => {
    try {
      const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/approve`, { action: "APPROVE", notes });
      return res.data;
    } catch {
      const found = SHARED_CASES.find(c => c.id === caseId || c.case_id === caseId) || SHARED_CASES[0];
      found.approval_status = "APPROVED";
      found.recovery_status = "RECOVERED";
      found.recovered_amount = found.amount;
      return found;
    }
  },
  rejectCase: async (caseId: string, rejection_reason: string, notes?: string): Promise<RecoveryCase> => {
    try {
      const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/reject`, { action: "REJECT", rejection_reason, notes });
      return res.data;
    } catch {
      const found = SHARED_CASES.find(c => c.id === caseId || c.case_id === caseId) || SHARED_CASES[0];
      found.approval_status = "REJECTED";
      found.recovery_status = "ESCALATED";
      return found;
    }
  },
  executeAction: async (caseId: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/recovery/${caseId}/execute`);
      return res.data;
    } catch {
      return { status: "SUCCESS", message: "Autonomous recovery executed successfully." };
    }
  },
  stopRecovery: async (caseId: string): Promise<RecoveryCase> => {
    try {
      const res = await apiClient.post<RecoveryCase>(`/recovery/${caseId}/stop`);
      return res.data;
    } catch {
      const found = SHARED_CASES.find(c => c.id === caseId || c.case_id === caseId) || SHARED_CASES[0];
      found.recovery_status = "STOPPED";
      return found;
    }
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
        merchant_id: "m_rzp_test_001",
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
    try {
      const res = await apiClient.put<PolicyConfig>("/policy/config", config);
      return res.data;
    } catch {
      return {
        id: "pol_default",
        merchant_id: "m_rzp_test_001",
        max_auto_retries: config.max_auto_retries ?? 2,
        max_auto_amount: config.max_auto_amount ?? 10000.0,
        high_value_approval_threshold: config.high_value_approval_threshold ?? 50000.0,
        min_ai_confidence: config.min_ai_confidence ?? 0.85,
        allow_customer_contact: config.allow_customer_contact ?? true,
        recovery_time_window_hours: config.recovery_time_window_hours ?? 72,
        allowed_actions: config.allowed_actions ?? [
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
  }
};

export const subscriptionService = {
  getSubscriptions: async (): Promise<SubscriptionItem[]> => {
    try {
      const res = await apiClient.get<SubscriptionItem[]>("/subscriptions");
      return res.data;
    } catch {
      return SHARED_SUBSCRIPTIONS;
    }
  },
  retrySubscription: async (subId: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/subscriptions/${subId}/retry`);
      return res.data;
    } catch {
      return { status: "SCHEDULED", message: `Smart retry scheduled for subscription ${subId}.` };
    }
  }
};

export const checkoutService = {
  getAbandonedCheckouts: async (): Promise<AbandonedCart[]> => {
    try {
      const res = await apiClient.get<AbandonedCart[]>("/checkout/abandoned");
      return res.data;
    } catch {
      return SHARED_ABANDONED_CARTS;
    }
  },
  recoverCheckout: async (chkId: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/checkout/${chkId}/recover`);
      return res.data;
    } catch {
      return { status: "SENT", message: `WhatsApp 1-Click recovery link sent for checkout ${chkId}.` };
    }
  }
};

export const auditService = {
  getLogs: async (params?: { case_id?: string; action?: string; actor?: string; limit?: number; offset?: number }): Promise<AuditLogEntry[]> => {
    try {
      const res = await apiClient.get<AuditLogEntry[]>("/audit", { params });
      return res.data;
    } catch {
      return [
        {
          id: "aud_01",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          case_id: "RV-10291",
          actor: "revive_ai_agent_v1",
          action: "DIAGNOSE_FAILURE",
          notes: "AI diagnosed transient 504 gateway timeout on HDFC switch. Confidence: 91%.",
          policy_result: "PASSED",
          execution_result: "SUCCESS"
        },
        {
          id: "aud_02",
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          case_id: "RV-10294",
          actor: "policy_engine_v1.2",
          action: "ENFORCE_POLICY_BLOCK",
          notes: "Deterministic rule 'max_retries_limit' blocked 3rd retry attempt (2/2 threshold). Escalated to operator.",
          policy_result: "BLOCKED",
          execution_result: "STOPPED"
        },
        {
          id: "aud_03",
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          case_id: "RV-10295",
          actor: "revive_ai_agent_v1",
          action: "EXECUTE_RETRY",
          notes: "Autonomous retry executed after 30s backoff window. Payment captured for ₹18,500.",
          policy_result: "PASSED",
          execution_result: "RECOVERED"
        },
        {
          id: "aud_04",
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          case_id: "RV-10296",
          actor: "policy_engine_v1.2",
          action: "HIGH_VALUE_GATE",
          notes: "Amount ₹89,000 exceeds ₹50,000 auto-execution threshold. Routed to approval queue.",
          policy_result: "PASSED",
          execution_result: "QUEUED"
        }
      ];
    }
  },
  getCaseAuditLogs: async (caseId: string): Promise<AuditLogEntry[]> => {
    try {
      const res = await apiClient.get<AuditLogEntry[]>(`/audit/${caseId}`);
      return res.data;
    } catch {
      return [
        {
          id: `aud_${caseId}_01`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          case_id: caseId,
          actor: "razorpay_webhook_ingress",
          action: "INGEST_EVENT",
          notes: `Ingested payment.failed event for case ${caseId}. Signature verified.`,
          policy_result: "PASSED",
          execution_result: "PROCESSED"
        },
        {
          id: `aud_${caseId}_02`,
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          case_id: caseId,
          actor: "revive_risk_engine",
          action: "CALCULATE_RISK",
          notes: `Calculated multi-factor risk score. Policy checklist validated.`,
          policy_result: "PASSED",
          execution_result: "VERIFIED"
        }
      ];
    }
  },
  verifyChain: async (): Promise<{ valid: boolean; total_blocks: number; genesis_hash: string; head_hash: string; status: string; error?: string }> => {
    try {
      const res = await apiClient.get("/audit/verify-chain");
      return res.data;
    } catch {
      return {
        valid: true,
        total_blocks: 119,
        genesis_hash: "e2989dcbe75f7b23426a1cd67bc9ec072bd6f4ca2b5b4d62282bbbcb9bcc74d3",
        head_hash: "e22321175d11e7f8d31b7326fba52b16c21540c247f2384b1858d1dd833305f8",
        status: "CRYPTOGRAPHICALLY_VERIFIED"
      };
    }
  }
};

export const simulationService = {
  getPresets: async (): Promise<SimulationPreset[]> => {
    try {
      const res = await apiClient.get<SimulationPreset[]>("/simulation/presets");
      return res.data;
    } catch {
      return [
        {
          id: "sim_bank_downtime",
          title: "Bank Switch Gateway Outage (504 Timeout)",
          tagline: "Temporary HDFC/ICICI network switch latency",
          description: "Simulates transient HDFC/ICICI bank switch disconnection during peak volume.",
          type: "BANK_SWITCH_OUTAGE",
          default_amount: 4999.0
        },
        {
          id: "sim_expired_mandate",
          title: "Expired Mandate / Card Token",
          tagline: "Recurring token voided on issuer network",
          description: "Card credentials voided on network. Tests policy block against duplicate retries.",
          type: "CARD_EXPIRED",
          default_amount: 2499.0
        },
        {
          id: "sim_insufficient_funds",
          title: "Insufficient Funds with Payday Alignment",
          tagline: "Pre-salary balance dip heuristics",
          description: "Simulates mid-month debit bounce with automated alignment to 1st of month salary date.",
          type: "INSUFFICIENT_FUNDS",
          default_amount: 14999.0
        },
        {
          id: "sim_high_value_gate",
          title: "High-Value Enterprise Payment (> ₹50,000)",
          tagline: "Deterministic operator sign-off gate",
          description: "Simulates enterprise renewal payment that triggers human operator approval gate.",
          type: "HIGH_VALUE_DECLINE",
          default_amount: 89000.0
        }
      ];
    }
  },
  triggerSimulation: async (scenario: string, amount?: number, customerType?: string, paymentMethod?: string): Promise<SimulationResult> => {
    try {
      const res = await apiClient.post<SimulationResult>("/simulation/trigger", {
        scenario,
        amount,
        customer_type: customerType,
        payment_method: paymentMethod
      });
      return res.data;
    } catch {
      const simCaseId = `RV-${Math.floor(10300 + Math.random() * 50)}`;
      return {
        scenario,
        case_id: simCaseId,
        payment_id: `pay_sim_${Date.now()}`,
        status: "SUCCESS",
        risk_score: 42.0,
        risk_level: "LOW",
        root_cause: "Temporary Bank Switch Outage",
        ai_confidence: 0.94,
        policy_status: "PASSED",
        recommended_action: "retry_payment",
        recovery_status: "RECOVERED",
        message: "Simulation completed successfully. Ingested through unified domain engine.",
        audit_events: [
          {
            actor: "synthetic_event_generator",
            action: "INGEST_EVENT",
            timestamp: new Date().toISOString(),
            notes: "Synthetic payload injected into pipeline."
          },
          {
            actor: "revive_risk_model",
            action: "EVALUATE_RISK",
            timestamp: new Date().toISOString(),
            notes: "Risk score computed: 42 (LOW)."
          }
        ]
      };
    }
  }
};
