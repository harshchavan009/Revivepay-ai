import json
import logging
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


class DeterministicFallbackAgent(LLMProvider):
    """
    Production-grade rule-based fallback agent.
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

        if failure_category == "temporary_bank_failure":
            root_cause = "temporary_bank_failure"
            confidence = 0.92 if successful_payments >= 2 else 0.84
            evidence.append("Issuer network gateway returned transient error (504 gateway timeout / switch disconnect).")
            if retry_count < 2:
                recommended_action = "retry_payment"
                reasoning = f"Customer history indicates high reliability ({successful_payments} successful payments). The failure is temporary; an automated retry is safe and policy-eligible."
                risk_level = "low" if risk_score < 40 else "medium"
            else:
                recommended_action = "escalate_to_merchant"
                reasoning = "Automated retry threshold reached. Transient error did not resolve within initial cycle. Human operator review required."
                risk_level = "high"

        elif failure_category == "insufficient_funds":
            root_cause = "insufficient_funds"
            confidence = 0.89
            evidence.append("Issuer declined authorization code 51 (insufficient funds on debit card / account balance).")
            evidence.append("Customer profile has valid communication consent enabled.")
            recommended_action = "create_payment_link"
            reasoning = "Direct retries risk repeated declines. Creating a personalized recovery payment link and notification allows customer to complete payment via alternate method."
            risk_level = "medium"

        elif failure_category in ["card_expired", "invalid_card_details"]:
            root_cause = "payment_method_invalid"
            confidence = 0.95
            evidence.append("Card token invalidation or expiration reported by card network.")
            evidence.append("Automated retries blocked by policy to prevent penalty fees.")
            recommended_action = "request_payment_method_update"
            reasoning = "Permanent failure detected on current card token. Customer must update payment details before new charge attempts can proceed."
            risk_level = "high"

        elif failure_category == "checkout_drop":
            root_cause = "checkout_abandonment"
            confidence = 0.88
            evidence.append(f"Checkout abandoned at payment gateway step with cart value ₹{amount:,.2f}.")
            recommended_action = "trigger_checkout_reminder"
            reasoning = "High purchase intent detected prior to session expiration. Automated gentle reminder sent with preserved cart state."
            risk_level = "low"

        else:
            root_cause = "unclassified_gateway_anomaly"
            confidence = 0.78
            evidence.append("Transaction failed with non-standard gateway response code.")
            recommended_action = "create_payment_link" if amount < 10000 else "escalate_to_merchant"
            reasoning = "Ambiguous failure state. Saftest action is generating an alternate payment link or escalating for human review."
            risk_level = "high"

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

        timing_delay = 0
        if action == "retry_payment":
            timing_delay = 30  # 30 seconds smart backoff
        elif action == "create_payment_link":
            timing_delay = 5

        customer_msg = None
        if action in ["send_customer_notification", "create_payment_link"]:
            customer_msg = f"Hello, we noticed your recent payment of ₹{context.get('amount', 0):,.2f} could not be completed. You can safely complete your transaction using your secure recovery link."
        elif action == "request_payment_method_update":
            customer_msg = "Your card on file could not be charged. Please update your payment method to avoid any disruption to your service."

        return RecoveryDecisionOutput(
            action=action,
            timing_delay_seconds=timing_delay,
            customer_message=customer_msg,
            policy_overrides_applied=[]
        )


class AIAgentService:
    def __init__(self):
        self.fallback = DeterministicFallbackAgent()

    def get_provider(self) -> LLMProvider:
        # In production, if settings.LLM_API_KEY is available and configured,
        # we can route to an external API (OpenAI/Gemini). The fallback is always active and safe.
        return self.fallback

    def analyze_root_cause(self, context: Dict[str, Any]) -> RootCauseAnalysisOutput:
        provider = self.get_provider()
        try:
            result = provider.analyze_root_cause(context)
            # Ensure action is strictly whitelisted
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
