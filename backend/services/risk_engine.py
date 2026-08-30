from typing import Dict, Any, Tuple

class RevenueRiskEngine:
    """
    Deterministic Revenue Risk Engine for RevivePay AI.
    Calculates numerical revenue risk score (0-100) based on:
    - 0.35 * Transaction Value Factor
    - 0.25 * Recovery Likelihood Factor
    - 0.20 * Customer History Factor
    - 0.20 * Failure Severity Factor
    """
    MODEL_VERSION = "revive-risk-v1.2-deterministic"

    @classmethod
    def calculate_risk(
        cls,
        amount: float,
        failure_category: str,
        total_payments: int,
        successful_payments: int,
        failed_payments: int,
        retry_count: int,
        customer_tier: str = "STANDARD"
    ) -> Tuple[float, str, Dict[str, Any]]:
        # 1. Transaction Value Factor (0 to 100)
        # Higher amounts represent higher revenue impact at risk
        if amount <= 1000:
            value_factor = min(100.0, (amount / 1000.0) * 30.0)
        elif amount <= 10000:
            value_factor = 30.0 + ((amount - 1000.0) / 9000.0) * 40.0
        elif amount <= 50000:
            value_factor = 70.0 + ((amount - 10000.0) / 40000.0) * 20.0
        else:
            value_factor = min(100.0, 90.0 + ((amount - 50000.0) / 100000.0) * 10.0)

        # 2. Recovery Likelihood Factor (0 to 100, where higher score means higher risk / difficulty)
        # Driven by our Calibrated ML Recovery Likelihood Model (ml.predict)
        try:
            from ml.predict import predict_recovery_likelihood
            ml_res = predict_recovery_likelihood(
                amount=amount,
                failure_category=failure_category,
                customer_success_count=successful_payments,
                customer_failure_count=failed_payments,
                retry_count=retry_count
            )
            ml_prob = ml_res.get("recovery_likelihood_prob", 0.65)
            # Higher likelihood of recovery = lower risk
            recovery_factor = round(max(0.0, min(100.0, (1.0 - ml_prob) * 100.0)), 1)
            ml_meta = ml_res
        except Exception:
            recoverability_map = {
                "temporary_bank_failure": 20.0,
                "network_timeout": 25.0,
                "insufficient_funds": 55.0,
                "card_expired": 75.0,
                "invalid_card_details": 85.0,
                "fraud_block": 95.0,
                "checkout_drop": 40.0,
            }
            base_recovery_risk = recoverability_map.get(failure_category, 50.0)
            recovery_factor = min(100.0, base_recovery_risk + (retry_count * 15.0))
            ml_meta = {"recovery_likelihood_prob": 0.65, "algorithm": "heuristic_fallback"}

        # 3. Customer Payment History Factor (0 to 100)
        # High success ratio = lower risk; multiple past failures = high risk
        if total_payments == 0:
            history_factor = 45.0  # Unknown customer (neutral/moderate risk)
        else:
            success_rate = successful_payments / max(1, total_payments)
            history_factor = max(0.0, min(100.0, (1.0 - success_rate) * 100.0))
            
        # Tier adjustments
        if customer_tier == "VIP" or customer_tier == "ENTERPRISE":
            history_factor = max(10.0, history_factor * 0.7)

        # 4. Failure Severity Factor (0 to 100)
        severity_map = {
            "temporary_bank_failure": 25.0,
            "network_timeout": 30.0,
            "insufficient_funds": 50.0,
            "checkout_drop": 45.0,
            "card_expired": 80.0,
            "invalid_card_details": 90.0,
            "fraud_block": 100.0
        }
        severity_factor = severity_map.get(failure_category, 50.0)

        # Composite Weighted Calculation
        weighted_score = (
            (0.35 * value_factor) +
            (0.25 * recovery_factor) +
            (0.20 * history_factor) +
            (0.20 * severity_factor)
        )
        
        final_score = round(max(0.0, min(100.0, weighted_score)), 1)

        # Determine Risk Level
        if final_score < 30.0:
            risk_level = "LOW"
        elif final_score < 60.0:
            risk_level = "MEDIUM"
        elif final_score < 80.0:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        breakdown = {
            "transaction_value_factor": round(value_factor, 1),
            "recovery_likelihood_factor": round(recovery_factor, 1),
            "customer_history_factor": round(history_factor, 1),
            "failure_severity_factor": round(severity_factor, 1),
            "weights": {
                "value": 0.35,
                "recovery": 0.25,
                "history": 0.20,
                "severity": 0.20
            },
            "scoring_method": "deterministic_weighted_v1",
            "model_version": cls.MODEL_VERSION,
            "ml_recovery_model": ml_meta
        }

        return final_score, risk_level, breakdown
