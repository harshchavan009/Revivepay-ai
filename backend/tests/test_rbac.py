import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.auth_service import create_access_token
from backend.models.all_models import RecoveryCase, User
from backend.database import SessionLocal

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_token_for_role(role_name: str, email: str = None) -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == role_name).first()
        if not user:
            user_email = email or f"{role_name.lower()}@revivepay.ai"
        else:
            user_email = user.email
        return create_access_token({"sub": user_email, "role": role_name})
    finally:
        db.close()

def test_unauthenticated_approval_rejected():
    """Assert unauthenticated request to approve case returns 401 Unauthorized."""
    response = client.post("/api/recovery/RV-10291/approve", json={"notes": "Test approval"})
    assert response.status_code == 401

def test_support_operator_cannot_approve_case():
    """Assert support_operator role receives 403 Forbidden on approve endpoint."""
    token = get_token_for_role("SUPPORT_OPERATOR", "support@revivepay.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/recovery/RV-10291/approve",
        json={"notes": "Unauthorized support operator attempt"},
        headers=headers
    )
    assert response.status_code == 403
    assert "Not enough permissions" in response.json()["detail"]

def test_support_operator_cannot_execute_case():
    """Assert support_operator role receives 403 Forbidden on execute endpoint."""
    token = get_token_for_role("SUPPORT_OPERATOR", "support@revivepay.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/recovery/RV-10291/execute",
        headers=headers
    )
    assert response.status_code == 403

def test_revenue_operator_can_approve_case(db_session):
    """Assert revenue_operator role is authorized to approve cases (200 OK)."""
    case = db_session.query(RecoveryCase).first()
    assert case is not None
    
    token = get_token_for_role("REVENUE_OPERATOR", "operator@revivepay.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        f"/api/recovery/{case.case_id}/approve",
        json={"notes": "Authorized operator approval test"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["approval_status"] == "APPROVED"

def test_admin_can_approve_case(db_session):
    """Assert admin role is authorized to approve cases (200 OK)."""
    case = db_session.query(RecoveryCase).first()
    assert case is not None
    
    token = get_token_for_role("ADMIN", "admin@revivepay.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        f"/api/recovery/{case.case_id}/approve",
        json={"notes": "Admin approval test"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["approval_status"] == "APPROVED"
