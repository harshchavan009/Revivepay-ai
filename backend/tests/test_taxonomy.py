import pytest
from backend.events.taxonomy import (
    PaymentEventType, RecoveryEventType, SubscriptionEventType, CheckoutEventType,
    ALL_CANONICAL_EVENTS, is_canonical_event, validate_event_type
)
from backend.database import SessionLocal
from backend.models.all_models import AuditLog, PaymentEvent

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_payment_event_taxonomy():
    expected_payment_events = {
        "payment.created",
        "payment.authorized",
        "payment.captured",
        "payment.failed",
        "payment.refund.initiated",
        "payment.refund.processed"
    }
    actual_payment_events = {e.value for e in PaymentEventType}
    assert actual_payment_events == expected_payment_events

def test_recovery_event_taxonomy():
    expected_recovery_events = {
        "recovery.case.created",
        "recovery.risk.scored",
        "recovery.ai.diagnosed",
        "recovery.action.recommended",
        "recovery.policy.passed",
        "recovery.policy.blocked",
        "recovery.approval.requested",
        "recovery.approved",
        "recovery.rejected",
        "recovery.action.executed",
        "recovery.action.failed",
        "recovery.verified",
        "recovery.approval.stepup_verified",
        "recovery.escalated",
        "recovery.stopped"
    }
    actual_recovery_events = {e.value for e in RecoveryEventType}
    assert actual_recovery_events == expected_recovery_events

def test_subscription_event_taxonomy():
    expected_sub_events = {
        "subscription.activated",
        "subscription.pending",
        "subscription.charged",
        "subscription.halted"
    }
    actual_sub_events = {e.value for e in SubscriptionEventType}
    assert actual_sub_events == expected_sub_events

def test_checkout_event_taxonomy():
    expected_checkout_events = {
        "checkout.started",
        "checkout.payment_started",
        "checkout.abandoned",
        "checkout.recovered"
    }
    actual_checkout_events = {e.value for e in CheckoutEventType}
    assert actual_checkout_events == expected_checkout_events

def test_canonical_event_validator():
    # Valid canonical events
    assert is_canonical_event("payment.created") is True
    assert is_canonical_event("recovery.verified") is True
    assert is_canonical_event("subscription.halted") is True
    assert is_canonical_event("checkout.abandoned") is True
    assert validate_event_type("recovery.ai.diagnosed") == "recovery.ai.diagnosed"

    # Non-canonical / vague events rejected
    assert is_canonical_event("something happened") is False
    assert is_canonical_event("payment_unknown") is False
    with pytest.raises(ValueError):
        validate_event_type("something happened")

def test_database_events_are_canonical(db_session):
    """
    Verify all persisted AuditLog and PaymentEvent records strictly conform to the taxonomy.
    """
    audit_logs = db_session.query(AuditLog).all()
    assert len(audit_logs) > 0
    for log in audit_logs:
        assert is_canonical_event(log.event_type), f"AuditLog {log.audit_id} has non-canonical event_type '{log.event_type}'"

    payment_events = db_session.query(PaymentEvent).all()
    assert len(payment_events) > 0
    for pe in payment_events:
        assert is_canonical_event(pe.event_type), f"PaymentEvent {pe.event_id} has non-canonical event_type '{pe.event_type}'"
