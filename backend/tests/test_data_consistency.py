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
