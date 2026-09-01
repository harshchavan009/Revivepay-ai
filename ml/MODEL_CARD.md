# RevivePay ML Recovery Likelihood Model Card

> **Methodology Disclosure**:  
> **Baseline recovery-likelihood model evaluated on a synthetic held-out dataset.**  
> Metrics reported in this model card reflect an 80/20 train/test split on simulated payment failure telemetry modeled after Indian payment rail dynamics (Razorpay, UPI, cards, and netbanking), not unverified production claims.

---

## 1. Model Overview

| Attribute | Specification |
| :--- | :--- |
| **Model Name** | RevivePay Calibrated Gradient Boosting Recovery Classifier |
| **Model Version** | `v1.2.0` |
| **Task** | Binary Classification ($P(\text{recovery\_success} \in \{0, 1\})$) |
| **Algorithm** | `CalibratedClassifierCV(estimator=GradientBoostingClassifier, method='isotonic', cv=5)` |
| **Base Estimator** | Gradient Boosting (`n_estimators=120`, `learning_rate=0.08`, `max_depth=4`, `subsample=0.85`) |
| **Calibration Method** | 5-Fold Cross-Validated Isotonic Regression |
| **Serialization** | `joblib` binary (`ml/artifacts/recovery_model_v1.joblib`) |

---

## 2. Dataset & Sampling Methodology

| Dimension | Details |
| :--- | :--- |
| **Dataset Type** | Synthetic payment failure telemetry (`ml/train.py:generate_synthetic_fintech_dataset`) |
| **Total Samples** | 5,000 synthetic failure events |
| **Training Set Size** | 4,000 samples (80% stratified split) |
| **Test Set Size** | 1,000 samples (20% held-out test split, stratified by outcome) |
| **Domain Modeling** | Simulates Indian digital payment mechanics: National Financial Switch (NFS) timeouts, issuer decline codes (51: Insufficient funds, 14: Invalid card), UPI VPA latency, and recurring e-mandate expiration. |
| **Class Distribution** | ~74.3% Recoverable (transient outages, retries, multi-rail links), ~25.7% Unrecoverable (void cards, permanent account closure, fraud blocks). |

---

## 3. Input Features (10 Candidate Signals)

The model evaluates a 10-dimensional feature vector extracted from transaction telemetry and customer history:

| # | Feature Name | Type | Domain Description |
| :---: | :--- | :---: | :--- |
| 1 | `transaction_amount` | Numerical (INR) | Transaction value in INR (log-normally distributed, ₹199 to ₹1,50,000). |
| 2 | `failure_category_encoded` | Categorical (0-7) | Failure mode index: `0: temporary_bank_failure`, `1: insufficient_funds`, `2: network_timeout`, `3: card_expired`, `4: mandate_limit_exceeded`, `5: do_not_honor`, `6: fraud_risk`, `7: other`. |
| 3 | `payment_method_encoded` | Categorical (0-5) | Payment rail: `0: upi`, `1: card`, `2: netbanking`, `3: wallet`, `4: emi`, `5: other`. |
| 4 | `customer_success_rate` | Float [0.1, 1.0] | Ratio of historical settled transactions over lifetime. |
| 5 | `customer_failure_rate` | Float [0.0, 0.9] | Ratio of historical failed transactions ($1.0 - \text{success\_rate}$). |
| 6 | `retry_count` | Integer [0-3] | Number of failed automated retries already attempted for this payment. |
| 7 | `customer_tenure_days` | Float [1-1500] | Age of customer account in days. |
| 8 | `is_subscription` | Binary [0, 1] | Recurring subscription billing vs. one-off merchant checkout. |
| 9 | `previous_recovery_success` | Binary [0, 1] | Indicator whether customer was previously recovered via RevivePay. |
| 10 | `checkout_intent_score` | Float [0.2, 1.0] | Pre-failure session engagement index (cart dwell time, OTP initiation). |

---

## 4. Empirical Evaluation Metrics (Held-Out Test Set)

Evaluated strictly on the 1,000 held-out test samples:

| Metric | Empirical Score | Definition |
| :--- | :---: | :--- |
| **ROC-AUC** | **0.8094** | Area Under Receiver Operating Characteristic Curve (held-out test split) |
| **Precision** | **0.8146** | True Positives / (True Positives + False Positives) |
| **Recall** | **0.9341** | True Positives / (True Positives + False Negatives) |
| **F1 Score** | **0.8702** | Harmonic mean of Precision and Recall |
| **Brier Score** | **0.1401** | Mean Squared Error between predicted probability and actual binary label |

### Confusion Matrix ($N=1,000$)

```
                       Predicted Negative    Predicted Positive
Actual Negative (257)          99                    158
Actual Positive (743)          49                    694
```

---

## 5. Probability Calibration & Reliability

Uncalibrated tree-based models often produce overconfident probability scores near 0 and 1. RevivePay applies **Isotonic Regression** via 5-fold cross-validation (`CalibratedClassifierCV`) to ensure that $P(\text{recovery\_success})$ represents true empirical yield:

- When the model outputs $P=0.50$, approximately 50% of such payments recover.
- When the model outputs $P=0.90$, approximately 90% of such payments recover.

### Reliability Curve (10 Bins)

| Bin | Mean Predicted Probability | Observed Empirical Frequency | Calibration Delta |
| :---: | :---: | :---: | :---: |
| 1 | 8.3% | 5.0% | +3.3% |
| 2 | 22.4% | 21.1% | +1.3% |
| 3 | 33.1% | 34.0% | -0.9% |
| 4 | 41.5% | 40.8% | +0.7% |
| 5 | 51.2% | 48.9% | +2.3% |
| 6 | 62.7% | 61.5% | +1.2% |
| 7 | 73.0% | 74.2% | -1.2% |
| 8 | 81.9% | 83.1% | -1.2% |
| 9 | 89.4% | 88.7% | +0.7% |
| 10 | 94.8% | 95.2% | -0.4% |

**Brier Score Loss**: `0.1401` (demonstrates tight calibration across all confidence strata).

---

## 6. Relative Feature Importances

Extracted from the underlying Gradient Boosting ensemble:

```
Failure Category       [█████████████████████████████████] 32.9%
Prior Retry Count      [███████████████████] 18.7%
Transaction Amount     [██████████] 10.0%
Customer Tenure Days   [██████████] 9.7%
Checkout Intent Score  [█████████] 9.1%
Customer Success Rate  [███████] 6.9%
Customer Failure Rate  [███████] 6.6%
Previous Recovery      [████] 3.9%
Payment Method         [██] 1.6%
Is Subscription        [█] 0.7%
```

---

## 7. Model Governance & Limitations

1. **Synthetic Training Baseline**: This model is trained and validated on synthetic distributions. It should be treated as an initial portfolio baseline until production telemetry is collected.
2. **Deterministic Overrides**: This ML model **never** executes recovery actions unilaterally. Its output probability feeds into the deterministic `RevenueRiskEngine`, which is strictly superseded by `PolicyGateway` limits (maximum 2 retries, ₹10,000 auto-limit, and customer DPDP consent).
3. **Reproducibility**: Run `python3 ml/train.py` with seed `42` to reproduce all reported metrics, artifacts, and calibration curves.
