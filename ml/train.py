"""
RevivePay AI — ML Recovery Likelihood Model Training Script
Trains a calibrated Gradient Boosting Classifier to predict P(recovery_success).
"""
import os
import json
import datetime
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    brier_score_loss,
    confusion_matrix
)
from ml.model_registry import (
    MODEL_FILE_PATH,
    METRICS_FILE_PATH,
    METADATA_FILE_PATH,
    FEATURE_COLUMNS,
    FAILURE_CATEGORY_MAP,
    PAYMENT_METHOD_MAP,
    save_metadata
)

def generate_synthetic_fintech_dataset(n_samples: int = 5000, random_state: int = 42) -> tuple:
    """
    Generates a realistic synthetic fintech payment failure dataset with 10 candidate features.
    Reflects actual payment dynamics (e.g. transient switch timeout has high recovery probability,
    expired card has lower probability, high customer success rate increases recovery likelihood).
    """
    rng = np.random.RandomState(random_state)
    
    # 1. Transaction Amount (INR)
    amounts = np.exp(rng.normal(loc=8.0, scale=1.2, size=n_samples))
    amounts = np.clip(amounts, 199.0, 150000.0)

    # 2. Failure Category (0: temporary_bank_failure, 1: insufficient_funds, 2: network_timeout, etc.)
    failure_cats = rng.choice(
        [0, 1, 2, 3, 4, 5, 6, 7],
        size=n_samples,
        p=[0.35, 0.25, 0.15, 0.10, 0.05, 0.04, 0.03, 0.03]
    )

    # 3. Payment Method (0: upi, 1: card, 2: netbanking, 3: wallet, 4: emi, 5: other)
    payment_methods = rng.choice(
        [0, 1, 2, 3, 4, 5],
        size=n_samples,
        p=[0.55, 0.25, 0.10, 0.05, 0.03, 0.02]
    )

    # 4. Customer Success Rate (0.0 to 1.0)
    customer_success_rates = np.clip(rng.beta(a=8, b=2, size=n_samples), 0.1, 1.0)

    # 5. Customer Failure Rate (0.0 to 1.0)
    customer_failure_rates = 1.0 - customer_success_rates

    # 6. Retry Count (0 to 3)
    retry_counts = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.50, 0.30, 0.15, 0.05])

    # 7. Customer Tenure Days (1 to 1000)
    tenures = rng.exponential(scale=180.0, size=n_samples) + 1.0
    tenures = np.clip(tenures, 1.0, 1500.0)

    # 8. Is Subscription (0 or 1)
    is_sub = rng.choice([0, 1], size=n_samples, p=[0.70, 0.30])

    # 9. Previous Recovery Success (0 or 1)
    prev_recovery = rng.choice([0, 1], size=n_samples, p=[0.60, 0.40])

    # 10. Checkout Intent Score (0.0 to 1.0)
    checkout_intents = np.clip(rng.beta(a=5, b=2, size=n_samples), 0.2, 1.0)

    # Assemble Feature Matrix X
    X = np.column_stack([
        amounts,
        failure_cats,
        payment_methods,
        customer_success_rates,
        customer_failure_rates,
        retry_counts,
        tenures,
        is_sub,
        prev_recovery,
        checkout_intents
    ])

    # Latent True Recovery Probability Formulation (Ground Truth Log-Odds)
    log_odds = (
        1.2 * (failure_cats == 0) +          # Bank switch outage -> highly recoverable
        1.0 * (failure_cats == 2) +          # Network timeout -> highly recoverable
        0.3 * (failure_cats == 1) -          # Insufficient funds -> moderate
        1.5 * (failure_cats == 3) -          # Card expired -> hard
        2.5 * (failure_cats == 6) +          # Fraud risk -> very low
        1.8 * customer_success_rates -       # High past success rate
        0.8 * retry_counts +                 # More failed retries reduce probability
        0.6 * prev_recovery +                # Previous recovery success
        0.5 * checkout_intents -             # Higher intent helps checkout recovery
        0.00001 * amounts -                  # Very large amounts slightly harder
        0.4                                  # Intercept baseline
    )

    true_prob = 1.0 / (1.0 + np.exp(-log_odds))
    # Binary outcome generation
    y = (rng.rand(n_samples) < true_prob).astype(int)

    return X, y

def train_recovery_model() -> dict:
    print("🤖 Starting RevivePay ML Recovery Likelihood Model Training...")
    
    X, y = generate_synthetic_fintech_dataset(n_samples=5000, random_state=42)
    
    # Train / Test split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Base Classifier: Gradient Boosting
    base_model = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42
    )

    # Probability Calibration using Isotonic Regression over 5-Fold Cross Validation
    calibrated_model = CalibratedClassifierCV(
        estimator=base_model,
        method="isotonic",
        cv=5
    )

    calibrated_model.fit(X_train, y_train)

    # Also fit base model on full training set to extract feature importances
    base_model.fit(X_train, y_train)
    raw_importances = base_model.feature_importances_
    total_imp = np.sum(raw_importances)
    norm_importances = {
        col: round(float(raw_importances[i] / total_imp), 4)
        for i, col in enumerate(FEATURE_COLUMNS)
    }

    # Evaluate on Held-Out Test Set
    y_pred_proba = calibrated_model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)

    roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    precision = float(precision_score(y_test, y_pred))
    recall = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    brier = float(brier_score_loss(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Calibration Curve (Reliability Diagram Data)
    prob_true, prob_pred = calibration_curve(y_test, y_pred_proba, n_bins=10)
    calibration_data = [
        {"bin": i + 1, "predicted_probability": round(float(pred), 4), "empirical_probability": round(float(true), 4)}
        for i, (pred, true) in enumerate(zip(prob_pred, prob_true))
    ]

    metrics = {
        "model_name": "RevivePay Calibrated Gradient Boosting Recovery Classifier",
        "model_version": "v1.2.0",
        "training_dataset_size": 5000,
        "test_dataset_size": 1000,
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "roc_auc": round(roc_auc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": cm,
        "feature_importances": norm_importances,
        "calibration_curve": calibration_data,
        "features": FEATURE_COLUMNS
    }

    # Save artifacts
    joblib.dump(calibrated_model, MODEL_FILE_PATH)
    with open(METRICS_FILE_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    save_metadata(metrics)

    print(f"✅ Model Training Complete!")
    print(f"   • ROC-AUC Score: {roc_auc:.4f}")
    print(f"   • Precision:     {precision:.4f}")
    print(f"   • Recall:        {recall:.4f}")
    print(f"   • F1 Score:      {f1:.4f}")
    print(f"   • Brier Score:   {brier:.4f}")
    print(f"   • Artifacts saved to: {MODEL_FILE_PATH}")

    return metrics

if __name__ == "__main__":
    train_recovery_model()
