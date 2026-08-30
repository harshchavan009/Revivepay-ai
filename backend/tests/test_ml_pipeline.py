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
    assert meta["roc_auc"] >= 0.70
    assert meta["f1_score"] >= 0.75
    assert meta["brier_score"] <= 0.20
    assert len(meta["feature_importances"]) == len(FEATURE_COLUMNS)
