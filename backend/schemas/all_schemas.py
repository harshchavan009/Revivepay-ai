import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ==========================================
# 1. MERCHANT SCHEMAS
# ==========================================
class MerchantResponse(BaseModel):
    merchant_id: str
    name: str
    industry: str
    currency: str
    timezone: str
    auto_recovery_enabled: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 2. CUSTOMER SCHEMAS
# ==========================================
class CustomerResponse(BaseModel):
    customer_id: str
    merchant_id: str
    external_customer_id: str
    name: str
    email: str
    account_tier: str
    total_successful_payments: int
    total_failed_payments: int
    lifetime_value: float
    last_successful_payment_at: Optional[datetime.datetime] = None
    consent_status: bool
    created_at: datetime.datetime

    # Backward compatibility helper
    @property
    def id(self) -> str:
        return self.customer_id

    @property
    def tier(self) -> str:
        return self.account_tier

    class Config:
        from_attributes = True


# ==========================================
# 3. PAYMENT SCHEMAS
# ==========================================
class PaymentResponse(BaseModel):
    payment_id: str
    merchant_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    provider: str = "razorpay"
    provider_payment_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    currency: str
    payment_method: str
    status: str
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    failure_category: Optional[str] = "temporary_bank_failure"
    retry_count: int
    max_retry_count: int = 2
    source: str = "RAZORPAY_TEST"
    source_description: str = "Event received from Razorpay Test environment"
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    # Backward compatibility
    @property
    def id(self) -> str:
        return self.payment_id

    @property
    def max_retries(self) -> int:
        return self.max_retry_count

    class Config:
        from_attributes = True


# ==========================================
# 4. PAYMENT EVENT SCHEMAS
# ==========================================
class PaymentEventResponse(BaseModel):
    event_id: str
    provider: str
    provider_event_id: Optional[str] = None
    event_type: str
    payment_id: str
    source: str = "RAZORPAY_TEST"
    source_description: str = "Event received from Razorpay Test environment"
    payload_hash: Optional[str] = None
    received_at: datetime.datetime
    processed_at: Optional[datetime.datetime] = None
    processing_status: str

    class Config:
        from_attributes = True


# ==========================================
# 5. RECOVERY CASE SCHEMAS
# ==========================================
class RecoveryCaseResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    payment_id: str
    payment_code: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_tier: Optional[str] = None
    source: str = "RAZORPAY_TEST"
    source_description: str = "Event received from Razorpay Test environment"
    case_type: str = "PAYMENT_FAILURE"
    amount: float
    amount_at_risk: float
    currency: str = "INR"
    failure_type: str = "BANK_DECLINE"
    risk_score: float
    risk_level: str
    risk_factors: Dict[str, Any]
    root_cause: Optional[str] = None
    ai_confidence: float
    evidence: List[str]
    recommended_action: str
    reasoning_summary: Optional[str] = None
    policy_status: str
    policy_checklist: List[Dict[str, Any]]
    approval_required: bool = False
    approval_status: str
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None
    execution_status: str
    recovery_status: str
    outcome_verified: bool = False
    recovered_amount: float
    
    # RBI TAT Reference Framework (RBI/2019-20/67)
    tat_deadline: Optional[datetime.datetime] = None
    tat_status: str = "ON_TRACK" # ON_TRACK, DUE_TODAY, BREACHED
    accrued_compensation_inr: float = 0.0
    
    model_provider: Optional[str] = "deterministic_rules_engine"
    model_name: Optional[str] = "rule-engine-v2.1"
    overrode_ai_recommendation: bool = False
    ai_original_recommendation: Optional[str] = None
    ai_override_reason: Optional[str] = None
    raw_prompt: Optional[str] = None
    raw_response: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None

    # Backward compatibility properties for frontend
    @property
    def id(self) -> str:
        return self.case_id

    @property
    def amount(self) -> float:
        return self.amount_at_risk

    @property
    def failure_type(self) -> str:
        return self.root_cause or "BANK_DECLINE"

    class Config:
        from_attributes = True


# ==========================================
# 6. AGENT DECISION SCHEMAS
# ==========================================
class AgentDecisionResponse(BaseModel):
    decision_id: str
    case_id: str
    model_provider: str
    model_name: str
    prompt_version: str
    input_version: str
    root_cause: str
    confidence: float
    evidence: List[str]
    recommended_action: str
    decision_timestamp: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 7. RECOVERY ACTION SCHEMAS
# ==========================================
class RecoveryActionResponse(BaseModel):
    action_id: str
    case_id: str
    action_type: str
    requested_by: str
    approved_by: Optional[str] = None
    policy_decision: str
    execution_status: str
    provider_reference: Optional[str] = None
    attempt_number: int
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 8. POLICY EVALUATION SCHEMAS
# ==========================================
class PolicyEvaluationResponse(BaseModel):
    policy_evaluation_id: str
    case_id: str
    action: str
    rules_evaluated: List[Dict[str, Any]]
    decision: str
    reason: Optional[str] = None
    evaluated_at: datetime.datetime
    policy_version: str

    class Config:
        from_attributes = True


# ==========================================
# 9. APPROVAL SCHEMAS
# ==========================================
class ApprovalResponse(BaseModel):
    approval_id: str
    case_id: str
    requested_action: str
    risk_level: str
    requested_at: datetime.datetime
    requested_by: str
    approved_by: Optional[str] = None
    decision: str
    decision_reason: Optional[str] = None
    decided_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# 10. AUDIT LOG SCHEMAS
# ==========================================
class AuditLogResponse(BaseModel):
    audit_id: str
    case_id: Optional[str] = None
    source: str = "RAZORPAY_TEST"
    source_description: str = "Event received from Razorpay Test environment"
    event_type: str
    actor_type: str = "SYSTEM"
    actor_id: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime.datetime

    entry_hash: Optional[str] = None
    previous_hash: Optional[str] = None
    actor: Optional[str] = None
    action: Optional[str] = None
    policy_result: Optional[str] = None
    execution_result: Optional[str] = None
    notes: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    decision: Optional[Dict[str, Any]] = None

    @property
    def id(self) -> str:
        return self.audit_id

    class Config:
        from_attributes = True


# ==========================================
# 11. NOTIFICATION SCHEMAS
# ==========================================
class NotificationResponse(BaseModel):
    notification_id: str
    case_id: Optional[str] = None
    customer_id: str
    channel: str
    template: str
    message: str
    status: str
    provider_reference: Optional[str] = None
    sent_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# AUXILIARY / INTERACTIVE REQUEST SCHEMAS
# ==========================================
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Optional[str] = "REVENUE_OPERATOR"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds
    csrf_token: Optional[str] = None
    user: Dict[str, Any]

class StepUpVerifyRequest(BaseModel):
    case_id: str
    credential: str = Field(..., description="Operator password or 6-digit OTP code")

class StepUpVerifyResponse(BaseModel):
    success: bool
    step_up_token: str
    expires_in: int = 300
    message: str = "Step-up authentication successful"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    theme_preference: Optional[str] = "dark"
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class RootCauseAnalysisOutput(BaseModel):
    root_cause: str = Field(..., description="Root cause identifier e.g. temporary_bank_failure")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score 0.0 to 1.0")
    evidence: List[str] = Field(default_factory=list, description="Concrete factual evidence list")
    recommended_action: str = Field(..., description="Recommended tool action")
    reasoning_summary: str = Field(..., description="Clear explanation of the recommendation")
    risk_level: str = Field(..., description="Risk tier: low, medium, high, critical")
    model_provider: Optional[str] = Field("deterministic_rules_engine", description="anthropic | google | deterministic_rules_engine")
    model_name: Optional[str] = Field("rule-engine-v2.1", description="Model version")
    raw_prompt: Optional[str] = Field(None, description="Exact prompt sent to LLM")
    raw_response: Optional[str] = Field(None, description="Exact raw text response from LLM")
    latency_ms: Optional[float] = Field(None, description="Inference latency in milliseconds")

class RecoveryDecisionOutput(BaseModel):
    action: str
    timing_delay_seconds: int = 0
    customer_message: Optional[str] = None
    policy_overrides_applied: List[str] = Field(default_factory=list)

class RecoveryApprovalRequest(BaseModel):
    action: str = "APPROVE"
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    step_up_token: Optional[str] = None

class RecoveryExecutionResponse(BaseModel):
    case_id: str
    status: str
    action_executed: str
    execution_result: str
    recovered_amount: float
    message: str

class PolicyConfigResponse(BaseModel):
    id: str
    merchant_id: str
    max_auto_retries: int
    max_auto_amount: float
    high_value_approval_threshold: float
    min_ai_confidence: float
    allow_customer_contact: bool
    recovery_time_window_hours: int
    allowed_actions: List[str]
    mandate_afa_threshold: float = 15000.0
    tat_auto_escalate: bool = True
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class PolicyConfigUpdate(BaseModel):
    max_auto_retries: Optional[int] = None
    max_auto_amount: Optional[float] = None
    high_value_approval_threshold: Optional[float] = None
    min_ai_confidence: Optional[float] = None
    allow_customer_contact: Optional[bool] = None
    recovery_time_window_hours: Optional[int] = None
    mandate_afa_threshold: Optional[float] = None
    tat_auto_escalate: Optional[bool] = None
    allowed_actions: Optional[List[str]] = None

class SubscriptionResponse(BaseModel):
    id: str
    subscription_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_name: str
    amount: float
    currency: str
    billing_interval: str
    current_status: str
    retry_count: int
    max_retries: int
    failure_reason: Optional[str] = None
    next_retry_at: Optional[datetime.datetime] = None
    
    # RBI e-Mandate Fields
    afa_required: bool = False
    pre_debit_notification_sent_at: Optional[datetime.datetime] = None
    opt_out_status: bool = False
    opt_out_at: Optional[datetime.datetime] = None
    
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class AbandonedCheckoutResponse(BaseModel):
    id: str
    checkout_id: str
    customer_name: str
    customer_email: str
    cart_items: List[Dict[str, Any]]
    total_value: float
    currency: str
    intent_score: float
    status: str
    recovery_action: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    revenue_at_risk: float
    recovered_revenue: float
    recovery_rate: float
    failed_payments_count: int
    active_recovery_count: int
    escalated_cases_count: int
    awaiting_approval_count: int
    total_cases_count: Optional[int] = 0
    average_recovery_time_minutes: float
    retry_success_rate: float
    autonomous_recovery_rate: float

class SimulationTriggerRequest(BaseModel):
    scenario: str
    amount: Optional[float] = None
    customer_type: Optional[str] = "returning"
    payment_method: Optional[str] = "card"

class SimulationResponse(BaseModel):
    scenario: str
    case_id: Optional[str] = None
    payment_id: Optional[str] = None
    source: str = "SIMULATION"
    source_description: str = "Synthetic event generated by RevivePay"
    status: str
    risk_score: float
    risk_level: str
    root_cause: str
    ai_confidence: float
    recommended_action: str
    policy_status: str
    recovery_status: str
    model_name: Optional[str] = None
    overrode_ai_recommendation: bool = False
    ai_original_recommendation: Optional[str] = None
    ai_override_reason: Optional[str] = None
    message: str
    audit_events: List[Dict[str, Any]]
