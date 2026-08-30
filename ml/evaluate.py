"""
RevivePay AI — ML Recovery Likelihood Model Evaluation Script
Evaluates the trained model against test data and prints complete diagnostics.
"""
import os
import json
import joblib
from ml.model_registry import (
    MODEL_FILE_PATH,
    METRICS_FILE_PATH,
    METADATA_FILE_PATH,
    load_metadata
)
from ml.train import generate_synthetic_fintech_dataset
from sklearn.metrics import classification_report, roc_auc_score, brier_score_loss

def evaluate_current_model():
    if not os.path.exists(MODEL_FILE_PATH):
        print("⚠️ No trained model artifact found. Running ml/train.py first...")
        from ml.train import train_recovery_model
        train_recovery_model()

    model = joblib.load(MODEL_FILE_PATH)
    X, y = generate_synthetic_fintech_dataset(n_samples=2000, random_state=999)

    y_pred_proba = model.predict_proba(X)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)

    roc_auc = roc_auc_score(y, y_pred_proba)
    brier = brier_score_loss(y, y_pred_proba)

    print("\n" + "="*60)
    print("📊 REVIVEPAY ML MODEL EVALUATION REPORT")
    print("="*60)
    print(f"Artifact:    {MODEL_FILE_PATH}")
    print(f"ROC-AUC:     {roc_auc:.4f}")
    print(f"Brier Score: {brier:.4f} (Lower is better, <=0.15 is well-calibrated)")
    print("\nClassification Report (Threshold = 0.50):")
    print(classification_report(y, y_pred, target_names=["Recovery Failed (0)", "Recovery Success (1)"]))

    metadata = load_metadata()
    if metadata:
        print("\nTop 5 Predictive Features:")
        sorted_feats = sorted(metadata.get("feature_importances", {}).items(), key=lambda x: x[1], reverse=True)[:5]
        for name, imp in sorted_feats:
            print(f"  • {name:<28}: {imp*100:.1f}% importance")
    print("="*60 + "\n")

if __name__ == "__main__":
    evaluate_current_model()
