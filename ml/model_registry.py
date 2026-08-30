"""
RevivePay AI — ML Recovery Model Registry & Metadata Specification
"""
import os
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(MODEL_DIR, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

MODEL_FILE_PATH = os.path.join(ARTIFACTS_DIR, "recovery_model_v1.joblib")
METRICS_FILE_PATH = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
METADATA_FILE_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")

# Candidate Feature Definitions for Recovery Likelihood Prediction
FEATURE_COLUMNS = [
    "transaction_amount",
    "failure_category_encoded",
    "payment_method_encoded",
    "customer_success_rate",
    "customer_failure_rate",
    "retry_count",
    "customer_tenure_days",
    "is_subscription",
    "previous_recovery_success",
    "checkout_intent_score"
]

FAILURE_CATEGORY_MAP = {
    "temporary_bank_failure": 0,
    "insufficient_funds": 1,
    "network_timeout": 2,
    "card_expired": 3,
    "mandate_limit_exceeded": 4,
    "do_not_honor": 5,
    "fraud_risk": 6,
    "other": 7
}

PAYMENT_METHOD_MAP = {
    "upi": 0,
    "card": 1,
    "netbanking": 2,
    "wallet": 3,
    "emi": 4,
    "other": 5
}

class ModelMetadata(BaseModel):
    model_name: str = "RevivePay Calibrated Gradient Boosting Recovery Classifier"
    model_version: str = "v1.2.0"
    algorithm: str = "CalibratedClassifierCV(GradientBoostingClassifier)"
    training_dataset_size: int = 5000
    features: List[str] = FEATURE_COLUMNS
    trained_at: str
    roc_auc: float
    precision: float
    recall: float
    f1_score: float
    brier_score: float
    feature_importances: Dict[str, float]
    calibration_summary: Dict[str, Any]

def load_metadata() -> Optional[Dict[str, Any]]:
    if os.path.exists(METADATA_FILE_PATH):
        try:
            with open(METADATA_FILE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def save_metadata(metadata: Dict[str, Any]) -> None:
    with open(METADATA_FILE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
