import datetime
from typing import Dict, Any, List, Tuple, Optional
from backend.models.all_models import RecoveryCase, PolicyConfig, Payment, Customer, Subscription

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
        ai_confidence: float,
        subscription: Optional[Subscription] = None
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
        now = datetime.datetime.utcnow()

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

        # Rule 9: Reference RBI Turn Around Time (TAT) Framework (RBI/2019-20/67)
        if getattr(case, "tat_status", None) == "BREACHED" or (case.tat_deadline and now > case.tat_deadline):
            checklist.append({
                "rule": "rbi_tat_guideline_compliance",
                "description": "Statutory Turn Around Time (TAT) deadline must not be overdue (RBI/2019-20/67)",
                "passed": False,
                "details": f"TAT auto-reversal deadline breached. Statutory compensation accrued: ₹{case.accrued_compensation_inr:,.2f}. Escalated to operator review."
            })
            if status != "BLOCKED":
                status = "REVIEW_REQUIRED"
                reasons.append(f"Statutory TAT deadline breached. Accrued compensation: ₹{case.accrued_compensation_inr:,.2f}. Escalated to human operator queue.")
        else:
            checklist.append({
                "rule": "rbi_tat_guideline_compliance",
                "description": "Statutory Turn Around Time (TAT) deadline compliance (RBI/2019-20/67)",
                "passed": True,
                "details": f"Within statutory resolution window (Status: {getattr(case, 'tat_status', 'ON_TRACK')})"
            })

        # Rule 10: Reference RBI e-Mandate Framework (Pre-Debit Notification & Customer Opt-Out)
        if subscription:
            if subscription.opt_out_status:
                checklist.append({
                    "rule": "rbi_mandate_customer_opt_out",
                    "description": "Customer must not have opted out of this scheduled recurring debit",
                    "passed": False,
                    "details": f"Customer opted out of recurring charge on {subscription.opt_out_at.strftime('%Y-%m-%d %H:%M UTC') if subscription.opt_out_at else 'prior alert'}. Action blocked."
                })
                status = "BLOCKED"
                reasons.append("Customer initiated mandate opt-out for this cycle. Recovery debit blocked.")
            elif subscription.amount >= getattr(policy, "mandate_afa_threshold", 15000.0) or subscription.afa_required:
                # 24-hour pre-debit notification window check
                notified_at = subscription.pre_debit_notification_sent_at
                has_24h_window = notified_at and (now - notified_at) >= datetime.timedelta(hours=24)
                checklist.append({
                    "rule": "rbi_emandate_pre_debit_notification_window",
                    "description": "24-hour pre-debit alert window must be honored before automated retry (RBI e-Mandate Framework)",
                    "passed": bool(has_24h_window),
                    "details": "24-hour pre-debit window satisfied" if has_24h_window else "Pre-debit notification window (<24h or missing) has not elapsed. Automated retry blocked until window matures."
                })
                if not has_24h_window and proposed_action == "retry_payment":
                    status = "BLOCKED"
                    reasons.append("RBI e-Mandate Framework: 24-hour pre-debit notification window not satisfied. Retry blocked until window matures.")

        overall_reason = "; ".join(reasons) if reasons else "All deterministic policy and safety rules passed successfully."
        return status, checklist, overall_reason
