import uuid
import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# ==========================================
# 1. MERCHANT ENTITY
# ==========================================
class Merchant(Base):
    __tablename__ = "merchants"

    merchant_id = Column(String(100), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="Enterprise Fintech & SaaS")
    currency = Column(String(10), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")
    auto_recovery_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Auxiliary API keys
    razorpay_key_id = Column(String(100), nullable=True)
    razorpay_key_secret = Column(String(100), nullable=True)

    # Relationships
    users = relationship("User", back_populates="merchant")
    customers = relationship("Customer", back_populates="merchant")
    payments = relationship("Payment", back_populates="merchant")
    policies = relationship("PolicyConfig", back_populates="merchant", uselist=False)


# ==========================================
# 2. CUSTOMER ENTITY
# ==========================================
class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(100), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(100), ForeignKey("merchants.merchant_id"), nullable=False)
    external_customer_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. cust_8102
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    account_tier = Column(String(50), default="STANDARD") # STANDARD, RETURNING, VIP, ENTERPRISE
    total_successful_payments = Column(Integer, default=0)
    total_failed_payments = Column(Integer, default=0)
    lifetime_value = Column(Float, default=0.0)
    last_successful_payment_at = Column(DateTime, nullable=True)
    consent_status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="customers")
    payments = relationship("Payment", back_populates="customer")
    recovery_cases = relationship("RecoveryCase", back_populates="customer")
    notifications = relationship("Notification", back_populates="customer")


# ==========================================
# 3. PAYMENT ENTITY
# ==========================================
class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(String(100), primary_key=True, default=generate_uuid) # e.g. pay_89231
    merchant_id = Column(String(100), ForeignKey("merchants.merchant_id"), nullable=False)
    customer_id = Column(String(100), ForeignKey("customers.customer_id"), nullable=False)
    provider = Column(String(50), default="razorpay")
    provider_payment_id = Column(String(100), nullable=True)
    order_id = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    payment_method = Column(String(50), default="card") # card, upi, netbanking, wallet, emi
    status = Column(String(50), default="FAILED", index=True) # SUCCESS, FAILED, PENDING, RECOVERED
    failure_code = Column(String(100), nullable=True) # BAD_REQUEST_ERROR, BANK_DECLINE, INSUFFICIENT_FUNDS, CARD_EXPIRED, GATEWAY_TIMEOUT
    failure_reason = Column(String(255), nullable=True)
    failure_category = Column(String(100), default="temporary_bank_failure") # temporary_bank_failure, insufficient_funds, card_expired, checkout_drop, fraud_block
    retry_count = Column(Integer, default=0)
    max_retry_count = Column(Integer, default=2)
    source = Column(String(50), default="RAZORPAY_TEST") # RAZORPAY_TEST vs SIMULATION
    source_description = Column(String(255), default="Event received from Razorpay Test environment")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")
    payment_events = relationship("PaymentEvent", back_populates="payment", cascade="all, delete-orphan")
    recovery_case = relationship("RecoveryCase", back_populates="payment", uselist=False)


# ==========================================
# 4. PAYMENT EVENT ENTITY
# ==========================================
class PaymentEvent(Base):
    __tablename__ = "payment_events"
    __table_args__ = (
        UniqueConstraint('provider', 'provider_event_id', name='uq_provider_event_id'),
    )

    event_id = Column(String(100), primary_key=True, default=generate_uuid)
    provider = Column(String(50), default="razorpay", nullable=False)
    provider_event_id = Column(String(100), index=True, nullable=True) # Razorpay event ID e.g. event_H0u2fX3Y8K91aZ
    event_type = Column(String(100), nullable=False) # payment.failed, payment.authorized, payment.captured
    payment_id = Column(String(100), ForeignKey("payments.payment_id"), nullable=False)
    source = Column(String(50), default="RAZORPAY_TEST") # RAZORPAY_TEST vs SIMULATION
    source_description = Column(String(255), default="Event received from Razorpay Test environment")
    raw_webhook_body = Column(Text, nullable=True)
    signature = Column(String(255), nullable=True)
    payload_hash = Column(String(255), nullable=True)
    payload = Column(JSON, nullable=True)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processing_status = Column(String(50), default="PROCESSED") # PENDING, PROCESSED, DUPLICATE_IGNORED, FAILED

    payment = relationship("Payment", back_populates="payment_events")


# ==========================================
# 5. RECOVERY CASE ENTITY
# ==========================================
class RecoveryCase(Base):
    __tablename__ = "recovery_cases"

    case_id = Column(String(100), primary_key=True, default=generate_uuid) # e.g. RV-10291
    payment_id = Column(String(100), ForeignKey("payments.payment_id"), unique=True, nullable=False)
    customer_id = Column(String(100), ForeignKey("customers.customer_id"), nullable=False)
    source = Column(String(50), default="RAZORPAY_TEST") # RAZORPAY_TEST vs SIMULATION
    source_description = Column(String(255), default="Event received from Razorpay Test environment")
    case_type = Column(String(100), default="PAYMENT_FAILURE") # PAYMENT_FAILURE, SUBSCRIPTION_DUNNING, CHECKOUT_ABANDONMENT
    amount_at_risk = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    failure_type = Column(String(100), default="BANK_DECLINE")
    risk_score = Column(Float, default=50.0) # 0 to 100
    risk_level = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors = Column(JSON, default=dict)
    
    root_cause = Column(String(255), nullable=True)
    ai_confidence = Column(Float, default=0.85)
    evidence = Column(JSON, default=list)
    recommended_action = Column(String(100), default="retry_payment")
    reasoning_summary = Column(Text, nullable=True)
    
    policy_status = Column(String(50), default="PASSED") # PASSED, REVIEW_REQUIRED, BLOCKED
    policy_checklist = Column(JSON, default=list)
    
    approval_required = Column(Boolean, default=False)
    approval_status = Column(String(50), default="AUTO_APPROVED") # PENDING, APPROVED, REJECTED, AUTO_APPROVED
    rejection_reason = Column(String(255), nullable=True)
    approved_by = Column(String(255), nullable=True)
    
    execution_status = Column(String(50), default="IDLE") # IDLE, QUEUED, EXECUTING, COMPLETED, FAILED, BLOCKED
    recovery_status = Column(String(50), default="NEW", index=True) # NEW, ANALYZING, ACTION_RECOMMENDED, AWAITING_APPROVAL, APPROVED, REJECTED, EXECUTING, RECOVERED, FAILED, ESCALATED, STOPPED
    
    outcome_verified = Column(Boolean, default=False)
    recovered_amount = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    payment = relationship("Payment", back_populates="recovery_case")
    customer = relationship("Customer", back_populates="recovery_cases")
    agent_decisions = relationship("AgentDecision", back_populates="recovery_case", cascade="all, delete-orphan")
    recovery_actions = relationship("RecoveryAction", back_populates="recovery_case", cascade="all, delete-orphan")
    policy_evaluations = relationship("PolicyEvaluation", back_populates="recovery_case", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="recovery_case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="recovery_case", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recovery_case", cascade="all, delete-orphan")


# ==========================================
# 6. AGENT DECISION ENTITY
# ==========================================
class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    decision_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=False)
    model_provider = Column(String(50), default="gemini")
    model_name = Column(String(100), default="gemini-1.5-pro")
    prompt_version = Column(String(50), default="v2.1")
    input_version = Column(String(50), default="v1.0")
    root_cause = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    evidence = Column(JSON, default=list)
    recommended_action = Column(String(100), nullable=False)
    reasoning_narrative = Column(Text, nullable=True)
    prompt_raw = Column(Text, nullable=True)
    response_raw = Column(Text, nullable=True)
    decision_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    recovery_case = relationship("RecoveryCase", back_populates="agent_decisions")


# ==========================================
# 7. RECOVERY ACTION ENTITY
# ==========================================
class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    action_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=False)
    action_type = Column(String(100), nullable=False) # retry_payment, create_payment_link, send_customer_notification, request_payment_method_update, stop_recovery
    requested_by = Column(String(100), default="RevivePay AI Agent")
    approved_by = Column(String(100), nullable=True)
    policy_decision = Column(String(50), default="PASSED")
    execution_status = Column(String(50), default="COMPLETED") # QUEUED, EXECUTING, COMPLETED, FAILED, BLOCKED
    provider_reference = Column(String(100), nullable=True)
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_code = Column(String(100), nullable=True)
    error_message = Column(String(255), nullable=True)

    recovery_case = relationship("RecoveryCase", back_populates="recovery_actions")


# ==========================================
# 8. POLICY EVALUATION ENTITY
# ==========================================
class PolicyEvaluation(Base):
    __tablename__ = "policy_evaluations"

    policy_evaluation_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=False)
    action = Column(String(100), nullable=False)
    rules_evaluated = Column(JSON, default=list)
    decision = Column(String(50), nullable=False) # PASSED, REVIEW_REQUIRED, BLOCKED
    reason = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)
    policy_version = Column(String(50), default="v1.0")

    recovery_case = relationship("RecoveryCase", back_populates="policy_evaluations")


# ==========================================
# 9. APPROVAL ENTITY
# ==========================================
class Approval(Base):
    __tablename__ = "approvals"

    approval_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=False)
    requested_action = Column(String(100), nullable=False)
    risk_level = Column(String(50), default="HIGH")
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    requested_by = Column(String(100), default="Policy Gateway")
    approved_by = Column(String(100), nullable=True)
    decision = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    decision_reason = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)

    recovery_case = relationship("RecoveryCase", back_populates="approvals")


# ==========================================
# 10. AUDIT LOG ENTITY
# ==========================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=True)
    source = Column(String(50), default="RAZORPAY_TEST") # RAZORPAY_TEST vs SIMULATION
    source_description = Column(String(255), default="Event received from Razorpay Test environment")
    event_type = Column(String(100), nullable=False) # canonical events
    actor_type = Column(String(50), default="SYSTEM") # SYSTEM, OPERATOR, AI_AGENT, GATEWAY, SUPERVISOR
    actor_id = Column(String(100), default="RevivePay Autonomous Engine")
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    # Cryptographic Hash-Chaining for Immutable Audit Integrity
    entry_hash = Column(String(64), nullable=True, index=True)
    previous_hash = Column(String(64), nullable=True)

    # Backward compatibility aliases for API/Services
    action = Column(String(100), nullable=True)
    actor = Column(String(100), nullable=True)
    policy_result = Column(String(50), nullable=True)
    execution_result = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    input_data = Column(JSON, nullable=True)
    decision = Column(JSON, nullable=True)

    recovery_case = relationship("RecoveryCase", back_populates="audit_logs")


# ==========================================
# 11. NOTIFICATION ENTITY
# ==========================================
class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String(100), primary_key=True, default=generate_uuid)
    case_id = Column(String(100), ForeignKey("recovery_cases.case_id"), nullable=True)
    customer_id = Column(String(100), ForeignKey("customers.customer_id"), nullable=False)
    channel = Column(String(50), default="email") # email, sms, whatsapp, in_app
    template = Column(String(100), default="payment_recovery_reminder_v1")
    message = Column(Text, nullable=False)
    status = Column(String(50), default="DELIVERED") # QUEUED, SENT, DELIVERED, FAILED
    provider_reference = Column(String(100), nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    recovery_case = relationship("RecoveryCase", back_populates="notifications")
    customer = relationship("Customer", back_populates="notifications")


# ==========================================
# AUXILIARY PLATFORM ENTITIES
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="REVENUE_OPERATOR")
    merchant_id = Column(String(100), ForeignKey("merchants.merchant_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    theme_preference = Column(String(20), default="dark") # "dark" | "light" | "system"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="users")


class PolicyConfig(Base):
    __tablename__ = "policy_configs"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(100), ForeignKey("merchants.merchant_id"), unique=True, nullable=False)
    
    max_auto_retries = Column(Integer, default=2)
    max_auto_amount = Column(Float, default=10000.0)
    high_value_approval_threshold = Column(Float, default=50000.0)
    min_ai_confidence = Column(Float, default=0.85)
    allow_customer_contact = Column(Boolean, default=True)
    recovery_time_window_hours = Column(Integer, default=72)
    
    allowed_actions = Column(JSON, default=lambda: [
        "retry_payment",
        "create_payment_link",
        "send_customer_notification",
        "trigger_checkout_reminder",
        "request_payment_method_update",
        "escalate_to_merchant",
        "stop_recovery"
    ])
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="policies")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    subscription_id = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(String(100), nullable=False)
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    plan_name = Column(String(255), default="Enterprise Monthly Pro")
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    billing_interval = Column(String(50), default="monthly")
    current_status = Column(String(50), default="ACTIVE")
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    failure_reason = Column(String(255), nullable=True)
    next_retry_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AbandonedCheckout(Base):
    __tablename__ = "abandoned_checkouts"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    checkout_id = Column(String(100), unique=True, index=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    cart_items = Column(JSON, default=list)
    total_value = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    intent_score = Column(Float, default=85.0)
    status = Column(String(50), default="ABANDONED")
    recovery_action = Column(String(100), default="trigger_checkout_reminder")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    event_id = Column(String(255), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    signature = Column(String(255), nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# CHAT CONVERSATION PERSISTENCE ENTITIES
# ==========================================
class ChatThread(Base):
    __tablename__ = "chat_threads"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    session_id = Column(String(100), index=True, nullable=False)
    user_id = Column(String(100), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), default="Telemetry Inquiry")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(100), primary_key=True, default=generate_uuid)
    thread_id = Column(String(100), ForeignKey("chat_threads.id"), nullable=False)
    sender = Column(String(20), nullable=False) # "user" | "bot" | "tool"
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    citations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    thread = relationship("ChatThread", back_populates="messages")

