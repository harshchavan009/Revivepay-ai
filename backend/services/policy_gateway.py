from typing import Dict, Any, List, Tuple
from backend.models.all_models import RecoveryCase, PolicyConfig, Payment, Customer

class PolicyGateway:
    """
    Deterministic Policy Gateway.
    Guarantees that no AI recommendation or recovery action executes without passing
    strict, deterministic merchant and compliance safety rules.
    """

    @classmethod
    def evaluate(
        cls,
        case: RecoveryCase,
        payment: Payment,
        customer: Customer,
        policy: PolicyConfig,
        proposed_action: str,
        ai_confidence: float
    ) -> Tuple[str, List[Dict[str, Any]], str]:
        """
        Returns:
        - policy_status: "PASSED", "REVIEW_REQUIRED", "BLOCKED"
        - checklist: List of rule evaluation objects
        - overall_reason: Explanation
        """
        checklist = []
        status = "PASSED"
        reasons = []

        # Rule 1: Action Whitelist Check
        is_whitelisted = proposed_action in (policy.allowed_actions or [])
        checklist.append({
            "rule": "action_whitelisted",
            "description": f"Action '{proposed_action}' must be allowed in merchant policy configuration",
            "passed": is_whitelisted,
            "details": "Action is permitted" if is_whitelisted else "Action is not in allowed actions list"
        })
        if not is_whitelisted:
            status = "BLOCKED"
            reasons.append("Proposed action is not whitelisted by merchant policy.")

        # Rule 2: Payment Succeeded Guard (Duplicate Prevention)
        is_not_success = payment.status != "SUCCESS" and payment.status != "RECOVERED"
        checklist.append({
            "rule": "payment_not_already_succeeded",
            "description": "Payment must not be already marked SUCCESS or RECOVERED",
            "passed": is_not_success,
            "details": "Payment remains unpaid" if is_not_success else "Payment was already completed successfully"
        })
        if not is_not_success:
            status = "BLOCKED"
            reasons.append("Payment has already succeeded; recovery action blocked to prevent duplicate billing.")

        # Rule 3: Retry Limit Check
        if proposed_action == "retry_payment":
            within_retries = payment.retry_count < policy.max_auto_retries
            checklist.append({
                "rule": "max_retries_limit",
                "description": f"Retry count ({payment.retry_count}) must be less than limit ({policy.max_auto_retries})",
                "passed": within_retries,
                "details": f"Attempt {payment.retry_count + 1} of {policy.max_auto_retries}" if within_retries else f"Retry count ({payment.retry_count}) reached max limit ({policy.max_auto_retries})"
            })
            if not within_retries:
                status = "BLOCKED"
                reasons.append("Maximum automatic retries exhausted. Further retries blocked.")

        # Rule 4: Permanent Failure Check
        permanent_failure_codes = ["card_expired", "invalid_card_details", "fraud_block", "account_closed"]
        is_not_permanent = payment.failure_category not in permanent_failure_codes
        if proposed_action == "retry_payment":
            checklist.append({
                "rule": "permanent_failure_check",
                "description": "Payment must not be a permanent card or account failure",
                "passed": is_not_permanent,
                "details": "Failure is transient" if is_not_permanent else f"Failure category '{payment.failure_category}' is permanent; blind retry blocked"
            })
            if not is_not_permanent:
                status = "BLOCKED"
                reasons.append(f"Permanent failure category ({payment.failure_category}) prohibits automatic retrying.")

        # Rule 5: Auto Amount Limit Check
        within_auto_amount = payment.amount <= policy.max_auto_amount
        checklist.append({
            "rule": "auto_action_amount_limit",
            "description": f"Transaction amount (₹{payment.amount:,.2f}) must be within auto-action limit (₹{policy.max_auto_amount:,.2f})",
            "passed": within_auto_amount,
            "details": "Within automated execution threshold" if within_auto_amount else f"Amount ₹{payment.amount:,.2f} exceeds auto limit ₹{policy.max_auto_amount:,.2f} — requires human approval"
        })
        if not within_auto_amount and status != "BLOCKED":
            status = "REVIEW_REQUIRED"
            reasons.append("High transaction value requires human operator sign-off.")

        # Rule 6: High-Value Approval Threshold
        if payment.amount >= policy.high_value_approval_threshold:
            checklist.append({
                "rule": "high_value_threshold",
                "description": f"Transactions above ₹{policy.high_value_approval_threshold:,.2f} require mandatory senior approval",
                "passed": False,
                "details": f"Transaction amount (₹{payment.amount:,.2f}) flagged as high-value tier"
            })
            if status != "BLOCKED":
                status = "REVIEW_REQUIRED"
                reasons.append("High-value enterprise tier requires mandatory approval.")
        else:
            checklist.append({
                "rule": "high_value_threshold",
                "description": f"Transactions below ₹{policy.high_value_approval_threshold:,.2f} standard risk tier",
                "passed": True,
                "details": "Standard value tier"
            })

        # Rule 7: AI Confidence Threshold
        confidence_passed = ai_confidence >= policy.min_ai_confidence
        checklist.append({
            "rule": "ai_confidence_threshold",
            "description": f"AI model confidence ({int(ai_confidence * 100)}%) must meet merchant threshold ({int(policy.min_ai_confidence * 100)}%)",
            "passed": confidence_passed,
            "details": "Model confidence is acceptable" if confidence_passed else f"Confidence ({int(ai_confidence * 100)}%) below threshold ({int(policy.min_ai_confidence * 100)}%)"
        })
        if not confidence_passed and status != "BLOCKED":
            status = "REVIEW_REQUIRED"
            reasons.append("AI confidence score below configured threshold; operator verification required.")

        # Rule 8: Customer Contact Consent
        if proposed_action in ["send_customer_notification", "create_payment_link", "request_payment_method_update"]:
            contact_allowed = bool(getattr(customer, "consent_status", True) and policy.allow_customer_contact)
            checklist.append({
                "rule": "customer_contact_consent",
                "description": "Customer must have active contact consent and merchant policy allows messaging",
                "passed": contact_allowed,
                "details": "Contact consent verified" if contact_allowed else "Customer has opted out of notifications or merchant policy disabled contact"
            })
            if not contact_allowed:
                status = "BLOCKED"
                reasons.append("Customer contact consent missing or disabled.")

        overall_reason = "; ".join(reasons) if reasons else "All deterministic policy and safety rules passed successfully."
        return status, checklist, overall_reason
