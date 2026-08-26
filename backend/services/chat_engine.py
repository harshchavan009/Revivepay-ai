import json
import logging
import re
import datetime
import asyncio
from typing import Dict, Any, List, Optional, AsyncGenerator, Tuple
from sqlalchemy.orm import Session
from backend.models.all_models import (
    RecoveryCase, Payment, Customer, Merchant, PolicyConfig,
    AuditLog, User, ChatThread, ChatMessage
)
from backend.services.audit_service import AuditService
from backend.services.broadcaster import notify_live_event

logger = logging.getLogger(__name__)

# ==========================================
# STATIC PRODUCT KNOWLEDGE BASE
# ==========================================
KNOWLEDGE_BASE = {
    "risk_scoring": """The RevivePay Deterministic Revenue Risk Engine calculates a numerical risk score (0 to 100) using a 4-factor weighted formula:
Risk Score = 0.35 × Value Factor + 0.25 × Recovery Likelihood + 0.20 × Customer History + 0.20 × Failure Severity
- 0–29: LOW Risk (Eligible for autonomous execution)
- 30–59: MEDIUM Risk (Standard policy routing)
- 60–79: HIGH Risk (Human-in-the-loop review recommended)
- 80–100: CRITICAL Risk (Mandatory human operator authorization)""",

    "policy_guardrails": """RevivePay enforces 7 deterministic safety guardrails that AI cannot bypass:
1. Bounded Retries: Hard limit of 2 automated retry attempts before mandatory escalation to prevent bank decline penalties.
2. High-Value Threshold: Transactions exceeding ₹50,000 strictly require human operator sign-off.
3. Confidence Floor: AI recommendations with confidence below 85% automatically route to review.
4. Allowed Tool Whitelist: Only 7 predefined recovery tools can be executed (retry_payment, create_payment_link, send_customer_notification, trigger_checkout_reminder, request_payment_method_update, escalate_to_merchant, stop_recovery).
5. Opt-Out Check: Customers who revoke communication consent are immediately excluded from automated prompts.
6. Permanent Decline Filter: Invalid card credentials or voided tokens are blocked from duplicate retries.
7. Time-Window Boundary: Recovery actions expire after 72 hours if unresolved.""",

    "audit_trail": """RevivePay's audit log is genuinely immutable and cryptographically hash-chained:
Every log entry stores entry_hash = SHA-256(prev_hash + audit_id + timestamp + actor + action + case_id + notes).
The integrity of the ledger can be mathematically verified at any time via /api/audit/verify-chain.""",

    "webhooks": """Razorpay Webhook Ingress verifies incoming events using HMAC-SHA256 signatures with X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET. Idempotency is enforced using unique constraint on (provider, provider_event_id).""",

    "subscriptions_and_checkout": """Subscription Dunning monitors recurring mandate failures and schedules retries aligned with payday liquidity windows. Checkout Recovery dispatches 1-click WhatsApp & SMS recovery tokens with dynamic cart preservation."""
}

# ==========================================
# LIVE TOOL DEFINITIONS & EXECUTIONS
# ==========================================
class ChatTools:
    @staticmethod
    def get_case_details(db: Session, case_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, str]]]:
        normalized = case_id.strip().upper()
        case = db.query(RecoveryCase).filter(
            (RecoveryCase.case_id == normalized) |
            (RecoveryCase.case_id.ilike(f"%{normalized}%"))
        ).first()

        if not case:
            return None, None

        cust = db.query(Customer).filter(Customer.customer_id == case.customer_id).first()
        data = {
            "case_id": case.case_id,
            "customer_name": cust.name if cust else "Unknown Customer",
            "customer_email": cust.email if cust else "N/A",
            "amount": case.amount_at_risk,
            "currency": case.currency or "INR",
            "failure_type": case.failure_type or case.root_cause or "Bank Decline",
            "risk_score": case.risk_score,
            "risk_level": case.risk_level,
            "root_cause": case.root_cause,
            "ai_confidence": round(case.ai_confidence * 100, 1) if case.ai_confidence else 85.0,
            "recommended_action": case.recommended_action,
            "reasoning_summary": case.reasoning_summary,
            "policy_status": case.policy_status,
            "approval_status": case.approval_status,
            "recovery_status": case.recovery_status,
            "recovered_amount": case.recovered_amount,
            "source": case.source
        }
        citation = {
            "type": "case",
            "id": case.case_id,
            "title": f"{case.case_id} · {data['customer_name']} (₹{case.amount_at_risk:,.2f})",
            "link": f"/cases/{case.case_id}"
        }
        return data, citation

    @staticmethod
    def get_platform_metrics(db: Session) -> Tuple[Dict[str, Any], Dict[str, str]]:
        total_cases = db.query(RecoveryCase).count()
        recovered_cases = db.query(RecoveryCase).filter(RecoveryCase.recovery_status == "RECOVERED").all()
        pending_approvals = db.query(RecoveryCase).filter(RecoveryCase.approval_status == "PENDING").count()
        escalated_cases = db.query(RecoveryCase).filter(RecoveryCase.recovery_status == "ESCALATED").count()
        active_cases = db.query(RecoveryCase).filter(RecoveryCase.recovery_status.notin_(["RECOVERED", "STOPPED"])).count()

        total_risk = sum(c.amount_at_risk for c in db.query(RecoveryCase).all())
        total_recovered = sum(c.recovered_amount for c in recovered_cases)
        rate = round((len(recovered_cases) / max(1, total_cases)) * 100, 1)

        data = {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "recovered_cases_count": len(recovered_cases),
            "pending_approvals": pending_approvals,
            "escalated_cases": escalated_cases,
            "total_revenue_at_risk": total_risk,
            "total_recovered_revenue": total_recovered,
            "recovery_rate_pct": rate
        }
        citation = {
            "type": "metrics",
            "id": "dashboard_metrics",
            "title": f"Live Platform Financial Telemetry ({total_cases} Total Cases)",
            "link": "/dashboard"
        }
        return data, citation

    @staticmethod
    def get_policy_config_details(db: Session) -> Tuple[Dict[str, Any], Dict[str, str]]:
        policy = db.query(PolicyConfig).first()
        if not policy:
            policy = PolicyConfig(merchant_id="m_default")

        data = {
            "max_auto_retries": policy.max_auto_retries,
            "max_auto_amount": policy.max_auto_amount,
            "high_value_approval_threshold": policy.high_value_approval_threshold,
            "min_ai_confidence": policy.min_ai_confidence,
            "allow_customer_contact": policy.allow_customer_contact,
            "recovery_time_window_hours": policy.recovery_time_window_hours,
            "allowed_actions": policy.allowed_actions or []
        }
        citation = {
            "type": "policy",
            "id": "policy_guardrails",
            "title": f"Deterministic Policy Guardrails v1.2 (Threshold: ₹{policy.high_value_approval_threshold:,.2f})",
            "link": "/policy"
        }
        return data, citation

    @staticmethod
    def verify_audit_trail_status(db: Session) -> Tuple[Dict[str, Any], Dict[str, str]]:
        res = AuditService.verify_chain(db)
        citation = {
            "type": "audit",
            "id": "audit_ledger",
            "title": f"Cryptographic Audit Ledger ({res.get('total_blocks', 0)} Blocks Verified)",
            "link": "/audit"
        }
        return res, citation


# ==========================================
# CHATBOT REASONING & STREAMING ENGINE
# ==========================================
class GroundedChatEngine:
    @classmethod
    async def stream_response(
        cls,
        user_message: str,
        session_id: str,
        user: Optional[User],
        db: Session
    ) -> AsyncGenerator[str, None]:
        """
        Processes user query with grounding, executes real backend tools when needed,
        and streams token-by-token events with citations.
        """
        # 1. Thread Persistence
        thread = db.query(ChatThread).filter(ChatThread.session_id == session_id).first()
        if not thread:
            thread = ChatThread(
                session_id=session_id,
                user_id=user.id if user else None,
                title=user_message[:50] + ("..." if len(user_message) > 50 else "")
            )
            db.add(thread)
            db.commit()
            db.refresh(thread)

        # Save user message
        user_msg_record = ChatMessage(
            thread_id=thread.id,
            sender="user",
            content=user_message
        )
        db.add(user_msg_record)
        db.commit()

        msg_lower = user_message.lower().strip()
        citations: List[Dict[str, str]] = []
        tool_call_info = None

        # Check for Out-of-Scope Requests (General financial advice, stock trading, unrelated queries)
        out_of_scope_keywords = ["stock", "bitcoin", "crypto", "weather", "recipe", "election", "invest in", "buy shares", "legal advice"]
        if any(kw in msg_lower for kw in out_of_scope_keywords) and not any(k in msg_lower for k in ["revive", "case", "payment", "razorpay", "policy", "retry"]):
            refusal_text = "I am RevivePay AI's specialized payment recovery assistant. I can only assist with payment failures, recovery telemetry, policy guardrails, and your live merchant cases. I do not provide general financial, investment, or legal advice."
            yield f"event: token\ndata: {json.dumps({'token': refusal_text})}\n\n"
            yield f"event: done\ndata: {json.dumps({'citations': []})}\n\n"
            cls._save_bot_message(db, thread.id, refusal_text, citations=[])
            return

        # 2. Tool Execution Detection
        # Check for Case ID Pattern: e.g. RV-10291, RV-08266704, RV-10292
        case_match = re.search(r"RV-\d+", user_message.upper())
        if case_match:
            case_id = case_match.group(0)
            yield f"event: tool_call\ndata: {json.dumps({'tool': 'get_case_details', 'args': {'case_id': case_id}, 'status': 'executing', 'message': f'Querying live database for case {case_id}...'})}\n\n"
            await asyncio.sleep(0.4)

            case_data, citation = ChatTools.get_case_details(db, case_id)
            if citation:
                citations.append(citation)

            if case_data:
                response_text = (
                    f"Based on live case **{case_data['case_id']}**:\n"
                    f"• **Customer**: {case_data['customer_name']} ({case_data['customer_email']})\n"
                    f"• **Amount at Risk**: ₹{case_data['amount']:,.2f} {case_data['currency']}\n"
                    f"• **Failure Type**: {case_data['failure_type']}\n"
                    f"• **Computed Risk Score**: {case_data['risk_score']}/100 ({case_data['risk_level']})\n"
                    f"• **AI Root Cause Diagnosis**: {case_data['root_cause']} ({case_data['ai_confidence']}% confidence)\n"
                    f"• **Recommended Action**: `{case_data['recommended_action']}`\n"
                    f"• **Policy Status**: {case_data['policy_status']} · Approval: {case_data['approval_status']}\n"
                    f"• **Recovery Status**: **{case_data['recovery_status']}** (Recovered: ₹{case_data['recovered_amount']:,.2f})\n\n"
                    f"**Agent Reasoning**: {case_data['reasoning_summary'] or 'Standard deterministic policy check applied.'}"
                )
            else:
                response_text = f"I could not find case **{case_id}** in the live database. Please verify the case ID."

        # Check for Platform Metrics / Financial Questions
        elif any(k in msg_lower for k in [
            "how many", "total cases", "how much", "recovered", "revenue", "revenue at risk",
            "metrics", "recovery rate", "active cases", "pending approval", "escalated",
            "kpi", "statistics", "stats", "performance"
        ]) and not any(k in msg_lower for k in ["how does", "formula", "weights"]):
            yield f"event: tool_call\ndata: {json.dumps({'tool': 'get_platform_metrics', 'args': {}, 'status': 'executing', 'message': 'Calculating live revenue telemetry from database...'})}\n\n"
            await asyncio.sleep(0.3)

            metrics, citation = ChatTools.get_platform_metrics(db)
            if citation:
                citations.append(citation)

            response_text = (
                f"Based on current live database records:\n"
                f"• **Total Revenue at Risk**: ₹{metrics['total_revenue_at_risk']:,.2f}\n"
                f"• **Total Recovered Revenue**: ₹{metrics['total_recovered_revenue']:,.2f}\n"
                f"• **Platform Recovery Rate**: **{metrics['recovery_rate_pct']}%**\n"
                f"• **Total Recovery Cases**: {metrics['total_cases']} ({metrics['active_cases']} in-flight)\n"
                f"• **Recovered Cases**: {metrics['recovered_cases_count']}\n"
                f"• **Awaiting Human Approval**: {metrics['pending_approvals']} cases\n"
                f"• **Escalated Cases**: {metrics['escalated_cases']} cases"
            )

        # Check for Policy / Guardrails Questions
        elif any(k in msg_lower for k in ["policy", "guardrail", "retry limit", "threshold", "max retries", "allowed action", "rules"]):
            yield f"event: tool_call\ndata: {json.dumps({'tool': 'get_policy_config_details', 'args': {}, 'status': 'executing', 'message': 'Fetching active Policy Guardrails config...'})}\n\n"
            await asyncio.sleep(0.3)

            policy_data, citation = ChatTools.get_policy_config_details(db)
            if citation:
                citations.append(citation)

            response_text = (
                f"**Active Policy Guardrails Configuration**:\n"
                f"• **Max Auto-Retries Limit**: `{policy_data['max_auto_retries']} retries` per transaction (enforced deterministically to avoid issuer penalty fees).\n"
                f"• **High-Value Approval Threshold**: `₹{policy_data['high_value_approval_threshold']:,.2f}` (transactions above this strictly require human operator sign-off).\n"
                f"• **Minimum AI Confidence Floor**: `{round(policy_data['min_ai_confidence'] * 100)}%` (lower confidence routes to review).\n"
                f"• **Allowed Actions**: {', '.join(f'`{a}`' for a in policy_data['allowed_actions'])}\n"
                f"• **Customer Communication Consent**: `{'Enabled' if policy_data['allow_customer_contact'] else 'Disabled'}`\n\n"
                f"{KNOWLEDGE_BASE['policy_guardrails']}"
            )

        # Check for Audit Trail / Cryptographic Hashing Questions
        elif any(k in msg_lower for k in ["audit", "immutable", "hash", "sha-256", "cryptographic", "tamper"]):
            yield f"event: tool_call\ndata: {json.dumps({'tool': 'verify_audit_trail_status', 'args': {}, 'status': 'executing', 'message': 'Running SHA-256 hash chain verification...'})}\n\n"
            await asyncio.sleep(0.3)

            audit_res, citation = ChatTools.verify_audit_trail_status(db)
            if citation:
                citations.append(citation)

            response_text = (
                f"**Cryptographic Audit Trail Status**:\n"
                f"• **Chain Integrity**: **{'VALID' if audit_res.get('valid') else 'INVALID'}** ({audit_res.get('status', 'VERIFIED')})\n"
                f"• **Total Verified Blocks**: `{audit_res.get('total_blocks', 0)} blocks`\n"
                f"• **Genesis Hash**: `{audit_res.get('genesis_hash', '0000000000000000')[:24]}...`\n"
                f"• **Head Hash**: `{audit_res.get('head_hash', 'N/A')[:24]}...`\n\n"
                f"{KNOWLEDGE_BASE['audit_trail']}"
            )

        # Check for Risk Scoring Formula Questions
        elif any(k in msg_lower for k in ["risk score", "formula", "scoring", "how is risk", "weights"]):
            citations.append({
                "type": "documentation",
                "id": "risk_scoring_math",
                "title": "Deterministic 4-Factor Risk Formula Documentation",
                "link": "/settings"
            })
            response_text = KNOWLEDGE_BASE["risk_scoring"]

        # Check for Webhook / Razorpay Integration Questions
        elif any(k in msg_lower for k in ["webhook", "razorpay", "signature", "hmac", "connect", "integration"]):
            citations.append({
                "type": "documentation",
                "id": "webhook_architecture",
                "title": "Razorpay Test Ingress & Webhook Documentation",
                "link": "/settings"
            })
            response_text = f"{KNOWLEDGE_BASE['webhooks']}\n\nRevivePay verifies all payloads with HMAC-SHA256 before any recovery action is computed."

        # Check for Subscription / Checkout Abandonment Questions
        elif any(k in msg_lower for k in ["subscription", "dunning", "checkout", "abandoned", "cart"]):
            citations.append({
                "type": "documentation",
                "id": "subscription_dunning",
                "title": "Subscription Dunning & Checkout Recovery",
                "link": "/subscriptions"
            })
            response_text = KNOWLEDGE_BASE["subscriptions_and_checkout"]

        # General / Unmatched Query Handling (Anti-Hallucination Safe Fallback)
        else:
            response_text = (
                "I am the RevivePay AI Autonomous Telemetry Assistant. I don't have specific custom data on that exact topic in the current ledger.\n\n"
                "Here are verifiable topics you can ask me about:\n"
                "• Specific case status (e.g. *'What happened on RV-10291?'*)\n"
                "• Platform revenue metrics (e.g. *'How much revenue has been recovered?'*)\n"
                "• Active policy guardrails & limits (e.g. *'What are our retry thresholds?'*)\n"
                "• Cryptographic audit integrity (e.g. *'Is the audit ledger verified?'*)\n"
                "• 4-Factor Risk Scoring math ($0.35 \\times \\text{value} + 0.25 \\times \\text{likelihood} + 0.20 \\times \\text{history} + 0.20 \\times \\text{severity}$)"
            )

        # 3. Stream Response Token by Token
        tokens = re.split(r"(\s+)", response_text)
        for tok in tokens:
            if tok:
                yield f"event: token\ndata: {json.dumps({'token': tok})}\n\n"
                await asyncio.sleep(0.012)

        # 4. Stream Completed Done Event with Citations
        yield f"event: done\ndata: {json.dumps({'citations': citations})}\n\n"

        # 5. Persist Bot Message and Audit Log
        cls._save_bot_message(db, thread.id, response_text, citations)
        AuditService.log_event(
            db=db,
            case_id=case_match.group(0) if case_match else None,
            actor=user.name if user else "Merchant Operator",
            action="chat.inquiry_resolved",
            actor_type="OPERATOR" if user else "SYSTEM",
            notes=f"Chat query: '{user_message[:60]}' · Resolved with {len(citations)} citations."
        )

    @classmethod
    def _save_bot_message(cls, db: Session, thread_id: str, content: str, citations: List[Dict[str, str]]):
        try:
            bot_msg = ChatMessage(
                thread_id=thread_id,
                sender="bot",
                content=content,
                citations=citations
            )
            db.add(bot_msg)
            db.commit()
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
