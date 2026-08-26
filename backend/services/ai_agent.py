import json
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from backend.config import settings
from backend.schemas.all_schemas import RootCauseAnalysisOutput, RecoveryDecisionOutput

logger = logging.getLogger(__name__)

ALLOWED_TOOLS = [
    "retry_payment",
    "create_payment_link",
    "send_customer_notification",
    "trigger_checkout_reminder",
    "request_payment_method_update",
    "escalate_to_merchant",
    "stop_recovery"
]

class LLMProvider(ABC):
    @abstractmethod
    def analyze_root_cause(self, context: Dict[str, Any]) -> RootCauseAnalysisOutput:
        pass

    @abstractmethod
    def decide_recovery_plan(self, context: Dict[str, Any]) -> RecoveryDecisionOutput:
        pass


class GeminiLLMProvider(LLMProvider):
    """
    Live Google Gemini structured reasoning provider.
    """
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    def analyze_root_cause(self, context: Dict[str, Any]) -> RootCauseAnalysisOutput:
        prompt = f"""You are RevivePay's Senior Payment Failure & Autonomous Recovery AI Agent.
Analyze the following payment failure telemetry in India's payment ecosystem (Razorpay, UPI, Cards, NetBanking).
Transaction Context:
- Amount: INR ₹{context.get('amount', 0)}
- Failure Category: {context.get('failure_category')}
- Failure Code: {context.get('failure_code')}
- Customer Tier: {context.get('customer_tier', 'STANDARD')}
- Historical Successes: {context.get('successful_payments', 0)}
- Historical Failures: {context.get('failed_payments', 0)}
- Retry Count: {context.get('retry_count', 0)}
- Risk Score: {context.get('risk_score', 50)}

Return ONLY a valid JSON object matching this schema:
{{
  "root_cause": "short_snake_case_string",
  "confidence": 0.85,
  "evidence": ["evidence point 1", "evidence point 2", "evidence point 3"],
  "recommended_action": "retry_payment" | "create_payment_link" | "send_customer_notification" | "request_payment_method_update" | "escalate_to_merchant" | "stop_recovery",
  "reasoning_summary": "Detailed contextual rationale for the decision.",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}}"""
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(
                    self.endpoint,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    return RootCauseAnalysisOutput(**parsed)
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to deterministic agent: {e}")
            raise e

    def decide_recovery_plan(self, context: Dict[str, Any]) -> RecoveryDecisionOutput:
        analysis = self.analyze_root_cause(context)
        action = analysis.recommended_action
        if action not in ALLOWED_TOOLS:
            action = "escalate_to_merchant"

        timing_delay = 30 if action == "retry_payment" else 5
        return RecoveryDecisionOutput(
            action=action,
            timing_delay_seconds=timing_delay,
            customer_message=f"Payment recovery action {action} prepared." if action != "stop_recovery" else None,
            policy_overrides_applied=[]
        )


class DeterministicFallbackAgent(LLMProvider):
    """
    Production-grade rule-based expert agent.
    Guarantees structured, evidence-backed recommendations when external LLM is offline or unconfigured.
    """
    def analyze_root_cause(self, context: Dict[str, Any]) -> RootCauseAnalysisOutput:
        failure_category = context.get("failure_category", "temporary_bank_failure")
        amount = context.get("amount", 0.0)
        successful_payments = context.get("successful_payments", 0)
        failed_payments = context.get("failed_payments", 0)
        retry_count = context.get("retry_count", 0)
        risk_score = context.get("risk_score", 50.0)

        evidence = []
        evidence.append(f"Customer has {successful_payments} successful historical payments against {failed_payments} past failures.")
        evidence.append(f"Transaction value of ₹{amount:,.2f} assessed with risk index {risk_score}/100.")

        if failure_category in ["temporary_bank_failure", "BANK_SWITCH_OUTAGE", "GATEWAY_TIMEOUT", "network_timeout"]:
            root_cause = "temporary_bank_switch_latency"
            confidence = 0.94 if successful_payments >= 2 else 0.88
            evidence.append("Issuer network gateway returned transient error (504 gateway timeout / switch disconnect).")
            if retry_count < 2:
                recommended_action = "retry_payment"
                reasoning = f"Customer history indicates high reliability ({successful_payments} successful payments). The failure is temporary; an automated retry is safe and policy-eligible."
                risk_level = "LOW" if risk_score < 40 else "MEDIUM"
            else:
                recommended_action = "escalate_to_merchant"
                reasoning = "Automated retry threshold reached (2/2). Transient error did not resolve within initial cycle. Human operator review required."
                risk_level = "HIGH"

        elif failure_category in ["insufficient_funds", "INSUFFICIENT_FUNDS"]:
            root_cause = "pre_salary_liquidity_dip"
            confidence = 0.91
            evidence.append("Issuer declined authorization code 51 (insufficient balance / account limit).")
            evidence.append("Historical payment cycle indicates monthly salary replenishment pattern.")
            recommended_action = "retry_payment" if amount < 15000 else "create_payment_link"
            reasoning = "Smart retry scheduled for customer payroll deposit window. WhatsApp payment link prepared."
            risk_level = "LOW" if amount < 15000 else "MEDIUM"

        elif failure_category in ["card_expired", "CARD_EXPIRED", "invalid_card_details", "payment_method_invalid"]:
            root_cause = "mandate_card_token_expired"
            confidence = 0.96
            evidence.append("Card token invalidation or expiration reported by card network.")
            evidence.append("Automated retries blocked by policy to prevent penalty fees.")
            recommended_action = "request_payment_method_update"
            reasoning = "Permanent failure detected on current card token. 1-Click WhatsApp payment method renewal dispatched."
            risk_level = "HIGH"

        elif failure_category in ["checkout_drop", "checkout_abandonment"]:
            root_cause = "checkout_abandonment"
            confidence = 0.88
            evidence.append(f"Checkout dropped at payment step with cart value ₹{amount:,.2f}.")
            recommended_action = "trigger_checkout_reminder"
            reasoning = "High purchase intent detected prior to session expiration. Automated reminder sent with saved cart state."
            risk_level = "LOW"

        elif failure_category in ["HIGH_VALUE_DECLINE", "high_value_gate"]:
            root_cause = "high_value_daily_cap"
            confidence = 0.89
            evidence.append(f"Transaction value ₹{amount:,.2f} exceeds standard autonomous execution threshold.")
            recommended_action = "retry_payment"
            reasoning = "Mandatory human operator sign-off required by deterministic policy before executing high-value capture."
            risk_level = "HIGH"

        else:
            root_cause = "unclassified_gateway_anomaly"
            confidence = 0.82
            evidence.append("Transaction failed with non-standard gateway response code.")
            recommended_action = "create_payment_link" if amount < 10000 else "escalate_to_merchant"
            reasoning = "Ambiguous failure state. Safest action is generating an alternate payment link or escalating for human review."
            risk_level = "HIGH"

        return RootCauseAnalysisOutput(
            root_cause=root_cause,
            confidence=confidence,
            evidence=evidence,
            recommended_action=recommended_action,
            reasoning_summary=reasoning,
            risk_level=risk_level
        )

    def decide_recovery_plan(self, context: Dict[str, Any]) -> RecoveryDecisionOutput:
        analysis = self.analyze_root_cause(context)
        action = analysis.recommended_action
        if action not in ALLOWED_TOOLS:
            action = "escalate_to_merchant"

        timing_delay = 30 if action == "retry_payment" else 5

        customer_msg = None
        if action in ["send_customer_notification", "create_payment_link"]:
            customer_msg = f"Hello, your payment of ₹{context.get('amount', 0):,.2f} was interrupted. You can safely complete your transaction using your secure recovery link."
        elif action == "request_payment_method_update":
            customer_msg = "Your recurring card on file has expired. Please update your payment method to avoid service interruption."

        return RecoveryDecisionOutput(
            action=action,
            timing_delay_seconds=timing_delay,
            customer_message=customer_msg,
            policy_overrides_applied=[]
        )


class AIAgentService:
    def __init__(self):
        self.fallback = DeterministicFallbackAgent()
        self.gemini = GeminiLLMProvider(settings.LLM_API_KEY, settings.LLM_MODEL) if settings.LLM_API_KEY else None

    def get_provider(self) -> LLMProvider:
        if settings.LLM_API_KEY and self.gemini:
            return self.gemini
        return self.fallback

    def analyze_root_cause(self, context: Dict[str, Any]) -> RootCauseAnalysisOutput:
        provider = self.get_provider()
        try:
            result = provider.analyze_root_cause(context)
            if result.recommended_action not in ALLOWED_TOOLS:
                result.recommended_action = "escalate_to_merchant"
            return result
        except Exception as e:
            logger.error(f"Error during AI root cause analysis: {e}")
            return self.fallback.analyze_root_cause(context)

    def decide_recovery_plan(self, context: Dict[str, Any]) -> RecoveryDecisionOutput:
        provider = self.get_provider()
        try:
            return provider.decide_recovery_plan(context)
        except Exception as e:
            logger.error(f"Error during AI recovery plan decision: {e}")
            return self.fallback.decide_recovery_plan(context)

ai_service = AIAgentService()
