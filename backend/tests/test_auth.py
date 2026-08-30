import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_environment_endpoint():
    response = client.get("/api/auth/environment")
    assert response.status_code == 200
    data = response.json()
    assert data["environment"] == "sandbox"
    assert "Sandbox Environment — Razorpay Test Mode" in data["environment_label"]

@pytest.mark.parametrize("persona,expected_role", [
    ("merchant_owner", "MERCHANT_OWNER"),
    ("revenue_operator", "REVENUE_OPERATOR"),
    ("support_operator", "SUPPORT_OPERATOR"),
    ("admin", "ADMIN"),
])
def test_demo_login_endpoint(persona, expected_role):
    response = client.post("/api/auth/demo-login", json={"persona": persona})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == expected_role
    assert "@revivepay.ai" in data["user"]["email"]

def test_demo_login_invalid_persona():
    response = client.post("/api/auth/demo-login", json={"persona": "invalid_super_user"})
    assert response.status_code == 422
