import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.services.scheduler import generate_synthetic_telemetry_tick

client = TestClient(app)

def test_generate_synthetic_telemetry_tick():
    """Validates that scheduled telemetry generation creates realistic cases."""
    db = SessionLocal()
    try:
        res = generate_synthetic_telemetry_tick(db)
        assert res["status"] == "success"
        assert res["amount"] > 0
        assert res["case_id"].startswith("RV-")
        assert "recovery_status" in res
    finally:
        db.close()

def test_status_health_checks_endpoint():
    """Validates real-time system status and component health checks."""
    res = client.get("/api/status/health-checks")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] == "operational"
    assert data["overall_uptime_pct"] >= 99.0
    assert len(data["components"]) >= 5
    component_ids = [c["id"] for c in data["components"]]
    assert "recovery_engine" in component_ids
    assert "webhook_pipe" in component_ids
    assert "ai_cluster" in component_ids
    assert "audit_ledger" in component_ids

def test_manual_telemetry_tick_endpoint():
    """Validates that POST /api/status/telemetry-tick generates a transaction."""
    res = client.post("/api/status/telemetry-tick")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "details" in data
    assert data["details"]["status"] == "success"

def test_privacy_friendly_analytics_tracking():
    """Validates zero-PII telemetry tracking and summary reporting."""
    # 1. Track anonymous page view
    track_res = client.post(
        "/api/analytics/track",
        json={"page": "/changelog", "event_name": "page_view", "session_hash": "sess_test_123"}
    )
    assert track_res.status_code == 200
    assert track_res.json()["status"] == "recorded"

    # 2. Retrieve summary
    summary_res = client.get("/api/analytics/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["monthly_unique_visitors"] > 0
    assert summary["monthly_page_views"] > 0
    assert "Zero-Cookie" in summary["privacy_guarantee"]
