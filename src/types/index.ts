export type UserRole = "MERCHANT_OWNER" | "REVENUE_OPERATOR" | "SUPPORT_OPERATOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecoveryStatus = 
  | "NEW" 
  | "ANALYZING" 
  | "ACTION_RECOMMENDED" 
  | "AWAITING_APPROVAL" 
  | "APPROVED" 
  | "REJECTED" 
  | "EXECUTING" 
  | "RECOVERED" 
  | "FAILED" 
  | "ESCALATED" 
  | "STOPPED";

export type PolicyStatus = "PASSED" | "REVIEW_REQUIRED" | "BLOCKED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";

export type ExecutionStatus = "IDLE" | "QUEUED" | "EXECUTING" | "COMPLETED" | "FAILED" | "BLOCKED";

export type RecoveryToolAction = 
  | "retry_payment" 
  | "create_payment_link" 
  | "send_customer_notification" 
  | "trigger_checkout_reminder" 
  | "request_payment_method_update" 
  | "escalate_to_merchant" 
  | "stop_recovery";

// ==========================================
// 1. MERCHANT ENTITY
// ==========================================
export interface Merchant {
  merchant_id: string;
  name: string;
  industry: string;
  currency: string;
  timezone: string;
  auto_recovery_enabled: boolean;
  created_at: string;
}

// ==========================================
// 2. CUSTOMER ENTITY
// ==========================================
export interface Customer {
  id?: string;
  customer_id: string;
  merchant_id: string;
  external_customer_id: string;
  name: string;
  email: string;
  account_tier: "STANDARD" | "RETURNING" | "VIP" | "ENTERPRISE" | string;
  tier?: "STANDARD" | "RETURNING" | "VIP" | "ENTERPRISE" | string;
  total_successful_payments: number;
  total_failed_payments: number;
  lifetime_value: number;
  last_successful_payment_at?: string;
  consent_status: boolean;
  created_at: string;
}

// ==========================================
// 3. PAYMENT ENTITY
// ==========================================
export interface Payment {
  id?: string;
  payment_id: string;
  merchant_id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  provider?: string;
  provider_payment_id?: string;
  order_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "RECOVERED";
  failure_code?: string;
  failure_reason?: string;
  failure_category: string;
  retry_count: number;
  max_retry_count?: number;
  max_retries?: number;
  source?: "RAZORPAY_TEST" | "SIMULATION" | string;
  source_description?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// 4. PAYMENT EVENT ENTITY
// ==========================================
export interface PaymentEvent {
  event_id: string;
  provider: string;
  provider_event_id?: string;
  event_type: string;
  payment_id: string;
  source?: "RAZORPAY_TEST" | "SIMULATION" | string;
  source_description?: string;
  payload_hash?: string;
  received_at: string;
  processed_at?: string;
  processing_status: "PENDING" | "PROCESSED" | "FAILED" | string;
}

// ==========================================
// 5. RECOVERY CASE ENTITY
// ==========================================
export interface PolicyCheckItem {
  rule: string;
  description: string;
  passed: boolean;
  details: string;
}

export interface RiskFactorBreakdown {
  transaction_value_factor: number;
  recovery_likelihood_factor: number;
  customer_history_factor: number;
  failure_severity_factor: number;
  weights: {
    value: number;
    recovery: number;
    history: number;
    severity: number;
  };
  scoring_method?: string;
  model_version?: string;
}

export interface RecoveryCase {
  id?: string;
  case_id: string;
  payment_id: string;
  payment_code?: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_tier?: string;
  source?: "RAZORPAY_TEST" | "SIMULATION" | string;
  source_description?: string;
  case_type?: string;
  amount_at_risk?: number;
  amount: number;
  currency: string;
  failure_type: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactorBreakdown | Record<string, any>;
  root_cause?: string;
  ai_confidence: number;
  evidence: string[];
  recommended_action: RecoveryToolAction | string;
  reasoning_summary?: string;
  policy_status: PolicyStatus;
  policy_checklist: PolicyCheckItem[];
  approval_required?: boolean;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  approved_by?: string;
  execution_id?: string;
  executed_at?: string;
  execution_status: ExecutionStatus;
  recovery_status: RecoveryStatus;
  outcome_verified?: boolean;
  recovered_amount: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ==========================================
// 6. AGENT DECISION ENTITY
// ==========================================
export interface AgentDecision {
  decision_id: string;
  case_id: string;
  model_provider: string;
  model_name: string;
  prompt_version: string;
  input_version: string;
  root_cause: string;
  confidence: number;
  evidence: string[];
  recommended_action: string;
  decision_timestamp: string;
}

// ==========================================
// 7. RECOVERY ACTION ENTITY
// ==========================================
export interface RecoveryAction {
  action_id: string;
  case_id: string;
  action_type: string;
  requested_by: string;
  approved_by?: string;
  policy_decision: string;
  execution_status: string;
  provider_reference?: string;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  error_code?: string;
  error_message?: string;
}

// ==========================================
// 8. POLICY EVALUATION ENTITY
// ==========================================
export interface PolicyEvaluation {
  policy_evaluation_id: string;
  case_id: string;
  action: string;
  rules_evaluated: PolicyCheckItem[];
  decision: string;
  reason?: string;
  evaluated_at: string;
  policy_version: string;
}

// ==========================================
// 9. APPROVAL ENTITY
// ==========================================
export interface Approval {
  approval_id: string;
  case_id: string;
  requested_action: string;
  risk_level: string;
  requested_at: string;
  requested_by: string;
  approved_by?: string;
  decision: string;
  decision_reason?: string;
  decided_at?: string;
}

// ==========================================
// 10. AUDIT LOG ENTITY
// ==========================================
export interface AuditLogEntry {
  id?: string;
  audit_id?: string;
  case_id?: string;
  source?: "RAZORPAY_TEST" | "SIMULATION" | string;
  source_description?: string;
  event_type?: string;
  actor_type?: string;
  actor_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  metadata?: Record<string, any>;
  actor: string;
  action: string;
  timestamp: string;
  input_data?: Record<string, any>;
  decision?: Record<string, any>;
  policy_result?: string;
  execution_result?: string;
  notes?: string;
}

// ==========================================
// 11. NOTIFICATION ENTITY
// ==========================================
export interface Notification {
  notification_id: string;
  case_id?: string;
  customer_id: string;
  channel: "email" | "sms" | "whatsapp" | "in_app" | string;
  template: string;
  message: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | string;
  provider_reference?: string;
  sent_at: string;
}

// ==========================================
// AUXILIARY PLATFORM TYPES
// ==========================================
export interface PolicyConfig {
  id: string;
  merchant_id: string;
  max_auto_retries: number;
  max_auto_amount: number;
  high_value_approval_threshold: number;
  min_ai_confidence: number;
  allow_customer_contact: boolean;
  recovery_time_window_hours: number;
  allowed_actions: string[];
  updated_at: string;
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_interval: string;
  current_status: "ACTIVE" | "PAST_DUE" | "RECOVERED" | "CANCELLED";
  retry_count: number;
  max_retries: number;
  failure_reason?: string;
  next_retry_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AbandonedCart {
  id: string;
  checkout_id: string;
  customer_name: string;
  customer_email: string;
  cart_items: Array<{ name: string; qty: number; price: number }>;
  total_value: number;
  currency: string;
  intent_score: number;
  status: "ABANDONED" | "REMINDED" | "RECOVERED" | "EXPIRED";
  recovery_action: string;
  created_at: string;
}

export interface DashboardMetrics {
  revenue_at_risk: number;
  recovered_revenue: number;
  recovery_rate: number;
  failed_payments_count: number;
  active_recovery_count: number;
  escalated_cases_count: number;
  awaiting_approval_count: number;
  average_recovery_time_minutes: number;
  retry_success_rate: number;
  autonomous_recovery_rate: number;
}

export interface SimulationPreset {
  id: string;
  title: string;
  tagline: string;
  description: string;
  type: string;
  default_amount: number;
}

export interface SimulationResult {
  scenario: string;
  case_id?: string;
  payment_id?: string;
  checkout_id?: string;
  subscription_id?: string;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  root_cause: string;
  ai_confidence: number;
  recommended_action: string;
  policy_status: string;
  recovery_status: string;
  message: string;
  audit_events: Array<{ actor: string; action: string; timestamp: string; notes?: string }>;
}
