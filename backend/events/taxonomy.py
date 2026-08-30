from enum import Enum
from typing import Set

# ==========================================
# 1. PAYMENT EVENT TAXONOMY
# ==========================================
class PaymentEventType(str, Enum):
    PAYMENT_CREATED = "payment.created"
    PAYMENT_AUTHORIZED = "payment.authorized"
    PAYMENT_CAPTURED = "payment.captured"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUND_INITIATED = "payment.refund.initiated"
    PAYMENT_REFUND_PROCESSED = "payment.refund.processed"


# ==========================================
# 2. RECOVERY EVENT TAXONOMY
# ==========================================
class RecoveryEventType(str, Enum):
    CASE_CREATED = "recovery.case.created"
    RISK_SCORED = "recovery.risk.scored"
    AI_DIAGNOSED = "recovery.ai.diagnosed"
    ACTION_RECOMMENDED = "recovery.action.recommended"
    POLICY_PASSED = "recovery.policy.passed"
    POLICY_BLOCKED = "recovery.policy.blocked"
    APPROVAL_REQUESTED = "recovery.approval.requested"
    APPROVED = "recovery.approved"
    REJECTED = "recovery.rejected"
    ACTION_EXECUTED = "recovery.action.executed"
    ACTION_FAILED = "recovery.action.failed"
    VERIFIED = "recovery.verified"
    STEPUP_VERIFIED = "recovery.approval.stepup_verified"
    ESCALATED = "recovery.escalated"
    STOPPED = "recovery.stopped"


# ==========================================
# 3. SUBSCRIPTION EVENT TAXONOMY
# ==========================================
class SubscriptionEventType(str, Enum):
    SUBSCRIPTION_ACTIVATED = "subscription.activated"
    SUBSCRIPTION_PENDING = "subscription.pending"
    SUBSCRIPTION_CHARGED = "subscription.charged"
    SUBSCRIPTION_HALTED = "subscription.halted"


# ==========================================
# 4. CHECKOUT EVENT TAXONOMY
# ==========================================
class CheckoutEventType(str, Enum):
    CHECKOUT_STARTED = "checkout.started"
    CHECKOUT_PAYMENT_STARTED = "checkout.payment_started"
    CHECKOUT_ABANDONED = "checkout.abandoned"
    CHECKOUT_RECOVERED = "checkout.recovered"


# ==========================================
# 5. CHAT / INQUIRY EVENT TAXONOMY
# ==========================================
class ChatEventType(str, Enum):
    CHAT_INQUIRY_RESOLVED = "chat.inquiry_resolved"


# ==========================================
# COMPLETE CANONICAL EVENT REGISTRY
# ==========================================
ALL_CANONICAL_EVENTS: Set[str] = {
    # Payment events
    PaymentEventType.PAYMENT_CREATED.value,
    PaymentEventType.PAYMENT_AUTHORIZED.value,
    PaymentEventType.PAYMENT_CAPTURED.value,
    PaymentEventType.PAYMENT_FAILED.value,
    PaymentEventType.PAYMENT_REFUND_INITIATED.value,
    PaymentEventType.PAYMENT_REFUND_PROCESSED.value,

    # Recovery events
    RecoveryEventType.CASE_CREATED.value,
    RecoveryEventType.RISK_SCORED.value,
    RecoveryEventType.AI_DIAGNOSED.value,
    RecoveryEventType.ACTION_RECOMMENDED.value,
    RecoveryEventType.POLICY_PASSED.value,
    RecoveryEventType.POLICY_BLOCKED.value,
    RecoveryEventType.APPROVAL_REQUESTED.value,
    RecoveryEventType.APPROVED.value,
    RecoveryEventType.REJECTED.value,
    RecoveryEventType.ACTION_EXECUTED.value,
    RecoveryEventType.ACTION_FAILED.value,
    RecoveryEventType.VERIFIED.value,
    RecoveryEventType.STEPUP_VERIFIED.value,
    RecoveryEventType.ESCALATED.value,
    RecoveryEventType.STOPPED.value,

    # Subscription events
    SubscriptionEventType.SUBSCRIPTION_ACTIVATED.value,
    SubscriptionEventType.SUBSCRIPTION_PENDING.value,
    SubscriptionEventType.SUBSCRIPTION_CHARGED.value,
    SubscriptionEventType.SUBSCRIPTION_HALTED.value,

    # Checkout events
    CheckoutEventType.CHECKOUT_STARTED.value,
    CheckoutEventType.CHECKOUT_PAYMENT_STARTED.value,
    CheckoutEventType.CHECKOUT_ABANDONED.value,
    CheckoutEventType.CHECKOUT_RECOVERED.value,

    # Chat events
    ChatEventType.CHAT_INQUIRY_RESOLVED.value,
}

def is_canonical_event(event_type: str) -> bool:
    """Validates if a given event string strictly belongs to the canonical taxonomy."""
    return event_type in ALL_CANONICAL_EVENTS

def validate_event_type(event_type: str) -> str:
    """
    Validates the event type and raises ValueError if it is not in the canonical taxonomy.
    """
    if not is_canonical_event(event_type):
        raise ValueError(
            f"Invalid non-canonical event '{event_type}'. "
            f"Must be one of the defined taxonomy events in ALL_CANONICAL_EVENTS."
        )
    return event_type
