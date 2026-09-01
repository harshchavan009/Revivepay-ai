import pytest
from ml.model_registry import load_metadata, FEATURE_COLUMNS
from ml.train import generate_synthetic_fintech_dataset, train_recovery_model
from ml.predict import extract_features, predict_recovery_likelihood

def test_ml_dataset_generation():
    X, y = generate_synthetic_fintech_dataset(n_samples=500, random_state=123)
    assert X.shape == (500, len(FEATURE_COLUMNS))
    assert len(y) == 500
    assert set(y).issubset({0, 1})

def test_ml_feature_extraction():
    vec = extract_features(
        amount=14999.0,
        failure_category="temporary_bank_failure",
        payment_method="upi",
        customer_success_count=8,
        customer_failure_count=1,
        retry_count=1,
        customer_tenure_days=250,
        is_subscription=True,
        previous_recovery_success=True,
        checkout_intent_score=0.92
    )
    assert vec.shape == (1, 10)
    assert vec[0, 0] == 14999.0  # Amount
    assert 0.0 <= vec[0, 3] <= 1.0  # Success rate

def test_ml_inference_prediction():
    res = predict_recovery_likelihood(
        amount=5000.0,
        failure_category="temporary_bank_failure",
        payment_method="upi",
        customer_success_count=10,
        customer_failure_count=0,
        retry_count=0
    )
    assert "recovery_likelihood_prob" in res
    assert 0.0 <= res["recovery_likelihood_prob"] <= 1.0
    assert res["confidence_tier"] in ["HIGH", "MEDIUM", "LOW"]
    assert len(res["top_contributing_factors"]) > 0

def test_ml_model_metadata_and_metrics():
    meta = load_metadata()
    if not meta:
        meta = train_recovery_model()

    # Honest disclosure checks
    assert meta["evaluation_statement"] == "Baseline recovery-likelihood model evaluated on a synthetic held-out dataset."
    assert meta["dataset_type"] == "SYNTHETIC_HELD_OUT"
    assert meta["training_dataset_size"] == 4000
    assert meta["test_dataset_size"] == 1000
    assert len(meta["features"]) == 10

    # Empirical test split metrics
    assert 0.75 <= meta["roc_auc"] <= 0.90
    assert 0.75 <= meta["precision"] <= 0.95
    assert 0.80 <= meta["recall"] <= 1.00
    assert 0.80 <= meta["f1_score"] <= 0.95
    assert 0.05 <= meta["brier_score"] <= 0.25

    # Probability calibration
    assert len(meta["calibration_curve"]) == 10
    assert len(meta["feature_importances"]) == len(FEATURE_COLUMNS)


def test_system_evaluation_recruiter_endpoint():
    """
    Validates that /api/ml/recruiter-evaluation and /api/ml/system-summary
    return the exact benchmark and live metrics for recruiter and audit evaluation.
    """
    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)
    
    # 1. Recruiter evaluation endpoint
    res = client.get("/api/ml/recruiter-evaluation")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "SYSTEM EVALUATION"
    
    # Check benchmark contract
    benchmark = data["benchmark"]
    assert benchmark["events_processed"] == 1248
    assert benchmark["recovery_cases"] == 326
    assert benchmark["ai_decisions"] == 291
    assert benchmark["policy_blocks"] == 42
    assert benchmark["human_overrides"] == 17
    assert benchmark["recovered_revenue"] == "₹2.17L"
    assert benchmark["recovery_rate"] == "45.0%"
    assert benchmark["duplicate_webhooks_blocked"] == 12
    assert benchmark["invalid_webhooks_blocked"] == 4

    # Check ascii representation
    assert "SYSTEM EVALUATION" in data["ascii_representation"]
    assert "Events Processed            1,248" in data["ascii_representation"]
    assert "Recovered Revenue          ₹2.17L" in data["ascii_representation"]

    # 2. System summary endpoint integration
    sum_res = client.get("/api/ml/system-summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "recruiter_evaluation" in sum_data
    assert sum_data["recruiter_evaluation"]["benchmark"]["recovery_cases"] == 326

