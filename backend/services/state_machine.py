from enum import Enum
from typing import Dict, Set, Optional, Any
from sqlalchemy.orm import Session
from backend.models.all_models import RecoveryCase
from backend.services.audit_service import AuditService
from backend.events.taxonomy import RecoveryEventType

class RecoveryState(str, Enum):
    NEW = "NEW"
    ANALYZING = "ANALYZING"
    ACTION_RECOMMENDED = "ACTION_RECOMMENDED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    AUTO_APPROVED = "AUTO_APPROVED"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    RECOVERED = "RECOVERED"
    FAILED = "FAILED"
    REASSESS = "REASSESS"
    STOPPED = "STOPPED"
    ESCALATED = "ESCALATED"

# Explicit Finite State Machine Transition Graph
VALID_TRANSITIONS: Dict[RecoveryState, Set[RecoveryState]] = {
    RecoveryState.NEW: {
        RecoveryState.ANALYZING,
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.AWAITING_APPROVAL,
        RecoveryState.ESCALATED,
        RecoveryState.RECOVERED
    },
    RecoveryState.ANALYZING: {
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.ESCALATED,
        RecoveryState.STOPPED
    },
    RecoveryState.ACTION_RECOMMENDED: {
        RecoveryState.AWAITING_APPROVAL,
        RecoveryState.APPROVED,
        RecoveryState.AUTO_APPROVED,
        RecoveryState.EXECUTING,
        RecoveryState.ESCALATED,
        RecoveryState.STOPPED
    },
    RecoveryState.AWAITING_APPROVAL: {
        RecoveryState.APPROVED,
        RecoveryState.AUTO_APPROVED,
        RecoveryState.EXECUTING,
        RecoveryState.STOPPED,
        RecoveryState.ESCALATED
    },
    RecoveryState.APPROVED: {
        RecoveryState.EXECUTING,
        RecoveryState.STOPPED,
        RecoveryState.ESCALATED
    },
    RecoveryState.AUTO_APPROVED: {
        RecoveryState.EXECUTING,
        RecoveryState.STOPPED,
        RecoveryState.ESCALATED
    },
    RecoveryState.EXECUTING: {
        RecoveryState.VERIFYING,
        RecoveryState.RECOVERED,
        RecoveryState.FAILED,
        RecoveryState.ESCALATED
    },
    RecoveryState.VERIFYING: {
        RecoveryState.RECOVERED,
        RecoveryState.FAILED,
        RecoveryState.ESCALATED
    },
    RecoveryState.FAILED: {
        RecoveryState.REASSESS,
        RecoveryState.ESCALATED,
        RecoveryState.STOPPED
    },
    RecoveryState.REASSESS: {
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.AWAITING_APPROVAL,
        RecoveryState.STOPPED,
        RecoveryState.ESCALATED
    },
    RecoveryState.RECOVERED: set(),  # Terminal state
    RecoveryState.STOPPED: set(),    # Terminal state
    RecoveryState.ESCALATED: {       # Can be reassessed by senior human operator
        RecoveryState.REASSESS,
        RecoveryState.AWAITING_APPROVAL,
        RecoveryState.ACTION_RECOMMENDED,
        RecoveryState.STOPPED
    }
}

class RecoveryStateMachine:
    """
    Finite State Machine supervisor for autonomous and human-in-the-loop recovery cases.
    Guarantees state transition invariants and produces immutable audit records.
    """

    @classmethod
    def is_valid_transition(cls, from_state: str, to_state: str) -> bool:
        try:
            from_enum = RecoveryState(from_state)
            to_enum = RecoveryState(to_state)
        except ValueError:
            return False

        if from_enum == to_enum:
            return True

        return to_enum in VALID_TRANSITIONS.get(from_enum, set())

    @classmethod
    def transition(
        cls,
        db: Session,
        case: RecoveryCase,
        to_state: str,
        actor: str = "RevivePay State Supervisor",
        actor_type: str = "SUPERVISOR",
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> RecoveryCase:
        from_state = case.recovery_status or "NEW"

        if not cls.is_valid_transition(from_state, to_state):
            raise ValueError(
                f"Invalid state transition: Cannot transition recovery case from '{from_state}' to '{to_state}'"
            )

        case.recovery_status = to_state

        # Map to canonical taxonomy event
        state_event_map = {
            RecoveryState.NEW: RecoveryEventType.CASE_CREATED.value,
            RecoveryState.ANALYZING: RecoveryEventType.AI_DIAGNOSED.value,
            RecoveryState.ACTION_RECOMMENDED: RecoveryEventType.ACTION_RECOMMENDED.value,
            RecoveryState.AWAITING_APPROVAL: RecoveryEventType.APPROVAL_REQUESTED.value,
            RecoveryState.APPROVED: RecoveryEventType.APPROVED.value,
            RecoveryState.AUTO_APPROVED: RecoveryEventType.APPROVED.value,
            RecoveryState.EXECUTING: RecoveryEventType.ACTION_EXECUTED.value,
            RecoveryState.VERIFYING: RecoveryEventType.ACTION_EXECUTED.value,
            RecoveryState.RECOVERED: RecoveryEventType.VERIFIED.value,
            RecoveryState.FAILED: RecoveryEventType.ACTION_FAILED.value,
            RecoveryState.REASSESS: RecoveryEventType.ACTION_RECOMMENDED.value,
            RecoveryState.STOPPED: RecoveryEventType.STOPPED.value,
            RecoveryState.ESCALATED: RecoveryEventType.ESCALATED.value,
        }
        action_event = state_event_map.get(RecoveryState(to_state), RecoveryEventType.ACTION_EXECUTED.value)

        # Log transition event in tamper-evident audit ledger
        AuditService.log_event(
            db=db,
            case_id=case.case_id,
            actor=actor,
            action=action_event,
            actor_type=actor_type,
            before_state={"recovery_status": from_state},
            after_state={"recovery_status": to_state},
            metadata=metadata or {},
            notes=notes or f"Recovery state transitioned from {from_state} to {to_state}"
        )
        db.commit()
        db.refresh(case)
        return case
