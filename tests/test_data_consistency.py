import datetime
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models.all_models import RecoveryCase, Merchant, Customer, Payment
from backend.seed_data import seed_database

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_recovery_case_counts_are_strictly_consistent(db):
    """
    REGRESSION TEST (Phase 8.1 Data-Consistency Invariant):
    Asserts that:
    1. Dashboard summary metric `total_cases_count`
    2. Case count endpoint `GET /api/recovery/count`
    3. Direct case count alias `GET /api/cases/count`
    4. Full case list retrieval `GET /api/recovery/cases` (with no filter applied)
    all report the exact same count N in the same session.
    """
    # Force reseed database to known baseline
    seed_database(force_reseed=True)

    db_actual_count = db.query(RecoveryCase).count()
    assert db_actual_count > 0, "Database must have seeded recovery cases"

    # 1. Executive Dashboard Summary
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_cases_count"] == db_actual_count, (
        f"Dashboard summary reported {dash_data['total_cases_count']} but DB has {db_actual_count}"
    )

    # 2. Canonical Case Count Endpoint
    count_res = client.get("/api/recovery/count")
    assert count_res.status_code == 200
    assert count_res.json()["total_cases"] == db_actual_count

    # 3. Direct Alias Case Count Endpoint
    direct_count_res = client.get("/api/cases/count")
    assert direct_count_res.status_code == 200
    assert direct_count_res.json()["total_cases"] == db_actual_count

    # 4. Recovery Case Registry Full List
    cases_res = client.get("/api/recovery/cases")
    assert cases_res.status_code == 200
    cases_list = cases_res.json()
    assert len(cases_list) == db_actual_count, (
        f"RecoveryCasesPage registry endpoint returned {len(cases_list)} items but DB has {db_actual_count}"
    )

def test_tat_breached_case_present_in_registry_and_approval_queue(db):
    """
    REGRESSION TEST (Phase 8.3 TAT Breach Invariant):
    Verifies that the seeded dataset includes cases with `tat_status == 'BREACHED'`,
    accrued compensation > 0, and that they appear in `AWAITING_APPROVAL` status.
    """
    breached_cases = db.query(RecoveryCase).filter(RecoveryCase.tat_status == "BREACHED").all()
    assert len(breached_cases) > 0, "Must have seeded at least one TAT_BREACHED case"

    for bc in breached_cases:
        assert bc.accrued_compensation_inr > 0, f"Case {bc.case_id} is breached but compensation is 0"
        assert bc.approval_required is True
        assert bc.recovery_status == "AWAITING_APPROVAL"
        assert bc.policy_status == "REVIEW_REQUIRED"

    # Verify via API endpoint
    res = client.get("/api/recovery/cases")
    assert res.status_code == 200
    cases = res.json()
    breached_api = [c for c in cases if c.get("tat_status") == "BREACHED"]
    assert len(breached_api) > 0
    assert breached_api[0]["accrued_compensation_inr"] > 0


def test_dashboard_summary_strictly_matches_database_source_of_truth(db):
    """
    SINGLE SOURCE OF TRUTH INVARIANT TEST:
    Asserts that all 6 critical executive metrics reported by `GET /api/dashboard/summary`:
    1. Revenue at Risk
    2. Recovered Revenue
    3. Recovery Rate
    4. Failed Payments
    5. Active Recovery
    6. Escalated Cases
    are strictly calculated from underlying database records without hardcoded values,
    and that database state changes are immediately reflected in the API response.
    """
    from sqlalchemy import func
    import uuid

    # Reseed to clean state
    seed_database(force_reseed=True)

    # 1. Fetch from API
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    api_metrics = res.json()

    # 2. Query Database directly via SQL
    db_failed_count = db.query(Payment).filter(Payment.status.in_(["FAILED", "PENDING"])).count()
    
    db_risk_sum = db.query(func.sum(RecoveryCase.amount_at_risk)).filter(
        RecoveryCase.recovery_status.in_([
            "NEW", "ANALYZING", "ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "EXECUTING", "FAILED", "ESCALATED"
        ])
    ).scalar() or 0.0

    db_recovered_sum = db.query(func.sum(RecoveryCase.recovered_amount)).filter(
        RecoveryCase.recovery_status == "RECOVERED"
    ).scalar() or 0.0

    db_active_count = db.query(RecoveryCase).filter(
        RecoveryCase.recovery_status.in_(["NEW", "ANALYZING", "ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "EXECUTING"])
    ).count()

    db_escalated_count = db.query(RecoveryCase).filter(
        RecoveryCase.recovery_status == "ESCALATED"
    ).count()

    total_impact = db_risk_sum + db_recovered_sum
    db_recovery_rate = round((db_recovered_sum / max(1.0, total_impact)) * 100.0, 1) if total_impact > 0 else 0.0

    # 3. Assert exact equality with database
    assert api_metrics["revenue_at_risk"] == round(db_risk_sum, 2), "Revenue at Risk must match DB"
    assert api_metrics["recovered_revenue"] == round(db_recovered_sum, 2), "Recovered Revenue must match DB"
    assert api_metrics["recovery_rate"] == db_recovery_rate, "Recovery Rate must match DB"
    assert api_metrics["failed_payments_count"] == db_failed_count, "Failed Payments must match DB"
    assert api_metrics["active_recovery_count"] == db_active_count, "Active Recovery must match DB"
    assert api_metrics["escalated_cases_count"] == db_escalated_count, "Escalated Cases must match DB"

    # 4. Mutate database: simulate resolving an active case into RECOVERED
    active_case = db.query(RecoveryCase).filter(
        RecoveryCase.recovery_status.in_(["ACTION_RECOMMENDED", "AWAITING_APPROVAL"])
    ).first()
    assert active_case is not None

    amount = active_case.amount_at_risk
    active_case.recovery_status = "RECOVERED"
    active_case.recovered_amount = amount
    active_case.resolved_at = datetime.datetime.utcnow()
    active_case.outcome_verified = True
    db.commit()

    # 5. Verify API immediately reflects updated database state
    updated_res = client.get("/api/dashboard/summary")
    assert updated_res.status_code == 200
    updated_metrics = updated_res.json()

    assert updated_metrics["active_recovery_count"] == db_active_count - 1, "Active count must decrement"
    assert updated_metrics["recovered_revenue"] == round(db_recovered_sum + amount, 2), "Recovered revenue must increment"
    assert updated_metrics["revenue_at_risk"] == round(db_risk_sum - amount, 2), "Revenue at risk must decrement"


def test_ai_agent_budget_and_dynamic_model_names():
    """
    DYNAMIC MODEL NAMES & BUDGET INVARIANT TEST (Phase 2):
    Asserts that:
    1. GET /api/agent/budget returns non-empty model names for primary, fallback, and safe floor.
    2. Budget arithmetic invariant: used + remaining == total.
    3. is_exhausted correctly flags budget saturation.
    4. Model identifiers are valid and non-null strings.
    """
    res = client.get("/api/agent/budget")
    assert res.status_code == 200
    data = res.json()

    # Model identifiers must be dynamically configured non-empty strings
    assert isinstance(data.get("primary_model"), str) and len(data["primary_model"]) > 0
    assert isinstance(data.get("fallback_model"), str) and len(data["fallback_model"]) > 0
    assert isinstance(data.get("safe_floor_model"), str) and len(data["safe_floor_model"]) > 0

    # Budget arithmetic invariants
    assert data["used"] >= 0
    assert data["total"] > 0
    assert data["remaining"] == max(0, data["total"] - data["used"])
    assert data["is_exhausted"] == (data["used"] >= data["total"])
    assert data["deterministic_fallback_active"] == data["is_exhausted"]


def test_empty_state_invariants_and_filter_resilience():
    """
    HONEST EMPTY STATE & FILTER RESILIENCE TEST (Phase 2):
    Asserts that when filters match zero items:
    1. Payment list returns an empty list [] with HTTP 200 (never 500 or null).
    2. Recovery case list returns [] with HTTP 200.
    3. Failure reasons endpoint returns a valid list.
    4. Recruiter evaluation scorecard returns complete structural payload with no NaN values.
    """
    # 1. Unmatched payment filter
    pay_res = client.get("/api/payments?status=NONEXISTENT_FILTER_STATUS_XYZ")
    assert pay_res.status_code == 200
    assert pay_res.json() == []

    # 2. Unmatched case filter
    case_res = client.get("/api/recovery/cases?status=NONEXISTENT_STATUS_XYZ")
    assert case_res.status_code == 200
    assert case_res.json() == []

    # 3. Telemetry endpoints return clean lists
    funnel_res = client.get("/api/dashboard/funnel")
    assert funnel_res.status_code == 200
    assert isinstance(funnel_res.json(), list)
    assert len(funnel_res.json()) == 5

    # 4. System Evaluation Recruiter Scorecard
    eval_res = client.get("/api/ml/recruiter-evaluation")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert "benchmark" in eval_data
    assert "live" in eval_data
    assert eval_data["benchmark"]["recovery_rate"] == "45.0%"
    assert "%" in eval_data["live"]["recovery_rate"]
    assert "₹" in eval_data["live"]["recovered_revenue"]


