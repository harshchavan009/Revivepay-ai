import random
import datetime
import uuid
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models.all_models import (
    Merchant, Customer, Payment, PaymentEvent, RecoveryCase,
    AgentDecision, RecoveryAction, PolicyEvaluation, Approval,
    AuditLog, Notification, User, PolicyConfig, Subscription, AbandonedCheckout
)
from backend.events.taxonomy import (
    PaymentEventType, RecoveryEventType, SubscriptionEventType, CheckoutEventType
)
from backend.config import settings
from backend.services.auth_service import get_password_hash
from backend.services.risk_engine import RevenueRiskEngine

def seed_database(force_reseed: bool = False):
    db = SessionLocal()

    try:
        if not force_reseed and db.query(Payment).count() > 50:
            db.close()
            return
    except Exception:
        # If tables are not initialized yet, let caller/migration handle it
        db.close()
        return

    print("🌱 Seeding RevivePay AI with Canonical Event Taxonomy...")

    # Clear existing data if force reseeding
    if force_reseed:
        try:
            for tbl in reversed(Base.metadata.sorted_tables):
                db.execute(tbl.delete())
            db.commit()
        except Exception:
            db.rollback()

    # ==========================================
    # 1. MERCHANT ENTITY
    # ==========================================
    merchant = Merchant(
        merchant_id="m_apex_tech_2026",
        name="Apex Cloud Technologies",
        industry="Enterprise Fintech & SaaS",
        currency="INR",
        timezone="Asia/Kolkata",
        auto_recovery_enabled=True,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        razorpay_key_secret=None,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=180)
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    # Auxiliary Admin Users & Policy Config (Safe environment-configured demo credentials)
    users_data = [
        {"email": "owner@revivepay.ai", "name": "Aditya Sengupta", "role": "MERCHANT_OWNER"},
        {"email": "operator@revivepay.ai", "name": "Rohan Deshmukh", "role": "REVENUE_OPERATOR"},
        {"email": "support@revivepay.ai", "name": "Sneha Kulkarni", "role": "SUPPORT_OPERATOR"},
        {"email": "admin@revivepay.ai", "name": "Harsh Chavan", "role": "ADMIN"},
    ]
    for u in users_data:
        db.add(User(
            email=u["email"],
            name=u["name"],
            role=u["role"],
            hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
            merchant_id=merchant.merchant_id,
            is_active=True
        ))

    policy = PolicyConfig(
        merchant_id=merchant.merchant_id,
        max_auto_retries=2,
        max_auto_amount=10000.0,
        high_value_approval_threshold=50000.0,
        min_ai_confidence=0.85,
        allow_customer_contact=True,
        recovery_time_window_hours=72,
        allowed_actions=[
            "retry_payment",
            "create_payment_link",
            "send_customer_notification",
            "trigger_checkout_reminder",
            "request_payment_method_update",
            "escalate_to_merchant",
            "stop_recovery"
        ]
    )
    db.add(policy)
    db.commit()

    # ==========================================
    # 2. CUSTOMER ENTITY (100+)
    # ==========================================
    first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", 
                   "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Chiara", "Myra", "Anika", "Prisha", "Riya",
                   "Vikramaditya", "Karan", "Pooja", "Meera", "Siddharth", "Rahul", "Naveen", "Priya", "Sunil", "Rajesh"]
    last_names = ["Sharma", "Verma", "Gupta", "Malhotra", "Deshmukh", "Patil", "Iyer", "Nair", "Mehta", "Reddy",
                  "Chauhan", "Bose", "Sengupta", "Roy", "Kapoor", "Joshi", "Bhat", "Kulkarni", "Dubey", "Pandey"]

    customers = []
    demo_cust = Customer(
        customer_id="cust_vikram_1001",
        merchant_id=merchant.merchant_id,
        external_customer_id="cust_ext_1001",
        name="Vikramaditya Sharma",
        email="vikram.sharma@enterprise.in",
        account_tier="RETURNING",
        total_successful_payments=8,
        total_failed_payments=1,
        lifetime_value=48500.0,
        last_successful_payment_at=datetime.datetime.utcnow() - datetime.timedelta(days=12),
        consent_status=True,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=120)
    )
    db.add(demo_cust)
    customers.append(demo_cust)

    for i in range(2, 105):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        tier = random.choices(["STANDARD", "RETURNING", "VIP", "ENTERPRISE"], weights=[50, 30, 15, 5])[0]
        succ_p = random.randint(1, 20)
        failed_p = random.randint(0, 3)
        ltv = succ_p * random.uniform(1500, 8000)

        c = Customer(
            customer_id=f"cust_gen_{1000 + i}",
            merchant_id=merchant.merchant_id,
            external_customer_id=f"cust_ext_{1000 + i}",
            name=f"{fn} {ln}",
            email=f"{fn.lower()}.{ln.lower()}{i}@example.com",
            account_tier=tier,
            total_successful_payments=succ_p,
            total_failed_payments=failed_p,
            lifetime_value=round(ltv, 2),
            last_successful_payment_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 30)),
            consent_status=random.choice([True, True, True, False]),
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(15, 300))
        )
        db.add(c)
        customers.append(c)

    db.commit()
    for c in customers:
        db.refresh(c)

    # ==========================================
    # 3. FLAGSHIP KILLER DEMO PAYMENT & CASE (RAZORPAY TEST MODE)
    # ==========================================
    killer_payment = Payment(
        payment_id="pay_89231",
        merchant_id=merchant.merchant_id,
        customer_id=demo_cust.customer_id,
        provider="razorpay",
        provider_payment_id="pay_rzp_test_89231",
        order_id="order_rzp_9821a",
        amount=4999.0,
        currency="INR",
        payment_method="card",
        status="FAILED",
        failure_code="BANK_DECLINE",
        failure_reason="Issuer bank switch unavailable (504 timeout)",
        failure_category="temporary_bank_failure",
        retry_count=0,
        max_retry_count=2,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=18),
        updated_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=18)
    )
    db.add(killer_payment)
    db.commit()
    db.refresh(killer_payment)

    # Payment Events
    db.add(PaymentEvent(
        event_id="evt_89231_created",
        provider="razorpay",
        provider_event_id="pvt_evt_89231_c",
        event_type=PaymentEventType.PAYMENT_CREATED.value,
        payment_id=killer_payment.payment_id,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment",
        payload_hash="sha256_created_9f82",
        payload={"amount": 499900, "currency": "INR"},
        received_at=killer_payment.created_at - datetime.timedelta(seconds=2),
        processed_at=killer_payment.created_at - datetime.timedelta(seconds=2),
        processing_status="PROCESSED"
    ))
    db.add(PaymentEvent(
        event_id="evt_89231_fail",
        provider="razorpay",
        provider_event_id="pvt_evt_89231_f",
        event_type=PaymentEventType.PAYMENT_FAILED.value,
        payment_id=killer_payment.payment_id,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment",
        payload_hash="sha256_failed_9f82",
        payload={"amount": 499900, "currency": "INR", "error_code": "BANK_DECLINE"},
        received_at=killer_payment.created_at,
        processed_at=killer_payment.created_at,
        processing_status="PROCESSED"
    ))

    # Recovery Case
    killer_case = RecoveryCase(
        case_id="RV-10291",
        payment_id=killer_payment.payment_id,
        customer_id=demo_cust.customer_id,
        source="RAZORPAY_TEST",
        source_description="Event received from Razorpay Test environment",
        case_type="PAYMENT_FAILURE",
        amount_at_risk=4999.0,
        risk_score=87.0,
        risk_level="HIGH",
        risk_factors={
            "transaction_value_factor": 72.0,
            "recovery_likelihood_factor": 20.0,
            "customer_history_factor": 11.1,
            "failure_severity_factor": 25.0,
            "weights": {"value": 0.35, "recovery": 0.25, "history": 0.20, "severity": 0.20}
        },
        root_cause="Temporary Bank Failure",
        ai_confidence=0.91,
        evidence=[
            "Customer has 8 successful historical payments with 0 chargebacks",
            "Only 1 previous transient failure in lifetime history",
            "Current failure code 504 is eligible for recovery under policy",
            "Transaction value ₹4,999 is within normal operating range"
        ],
        recommended_action="retry_payment",
        reasoning_summary="Customer history indicates strong recoverability. Transient issuer gateway error resolved; safe for single automated retry.",
        policy_status="PASSED",
        policy_checklist=[
            {"rule": "action_whitelisted", "description": "Action 'retry_payment' permitted by policy", "passed": True, "details": "Permitted"},
            {"rule": "payment_not_already_succeeded", "description": "Payment remains unpaid", "passed": True, "details": "Unpaid"},
            {"rule": "max_retries_limit", "description": "Retry attempt 1 of 2", "passed": True, "details": "Within limit"},
            {"rule": "permanent_failure_check", "description": "Transient failure category", "passed": True, "details": "Eligible"},
            {"rule": "auto_action_amount_limit", "description": "Amount ₹4,999 <= ₹10,000 auto limit", "passed": True, "details": "Within limit"},
            {"rule": "ai_confidence_threshold", "description": "Confidence 91% >= 85% threshold", "passed": True, "details": "Passed"},
            {"rule": "customer_contact_consent", "description": "Customer consent active", "passed": True, "details": "Verified"}
        ],
        approval_required=True,
        approval_status="PENDING",
        execution_status="IDLE",
        recovery_status="AWAITING_APPROVAL",
        outcome_verified=False,
        recovered_amount=0.0,
        tat_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        tat_status="ON_TRACK",
        accrued_compensation_inr=0.0,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=18),
        updated_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=18)
    )
    db.add(killer_case)
    db.commit()
    db.refresh(killer_case)

    # Agent Decision Entity
    db.add(AgentDecision(
        decision_id="dec_89231",
        case_id=killer_case.case_id,
        model_provider="gemini",
        model_name="gemini-1.5-pro",
        prompt_version="v2.1",
        input_version="v1.0",
        root_cause="Temporary Bank Failure",
        confidence=0.91,
        evidence=killer_case.evidence,
        recommended_action="retry_payment",
        decision_timestamp=killer_case.created_at + datetime.timedelta(seconds=2)
    ))

    # Policy Evaluation Entity
    db.add(PolicyEvaluation(
        policy_evaluation_id="peval_89231",
        case_id=killer_case.case_id,
        action="retry_payment",
        rules_evaluated=killer_case.policy_checklist,
        decision="PASSED",
        reason="All 7 deterministic safety and limits rules passed.",
        evaluated_at=killer_case.created_at + datetime.timedelta(seconds=3),
        policy_version="v1.0"
    ))

    # Approval Entity
    db.add(Approval(
        approval_id="appr_89231",
        case_id=killer_case.case_id,
        requested_action="retry_payment",
        risk_level="HIGH",
        requested_at=killer_case.created_at + datetime.timedelta(seconds=4),
        requested_by="Policy Gateway",
        decision="PENDING",
        decision_reason="High risk score (87/100) routed to human operator sign-off."
    ))

    # Canonical Audit Trail for Flagship Demo
    t_base = killer_case.created_at
    canonical_audit_events = [
        ("Razorpay Ingestion Engine", PaymentEventType.PAYMENT_FAILED.value, "GATEWAY", t_base - datetime.timedelta(seconds=2), {"payment_id": "pay_89231", "amount": 4999.0}, None, None, None, "Payment failure event ingested from Razorpay webhook."),
        ("RevivePay Recovery Orchestrator", RecoveryEventType.CASE_CREATED.value, "SYSTEM", t_base, None, {"case_id": "RV-10291", "amount_at_risk": 4999.0}, None, None, "Recovery case created for failed payment pay_89231."),
        ("RevivePay Risk Engine", RecoveryEventType.RISK_SCORED.value, "SYSTEM", t_base + datetime.timedelta(seconds=1), None, {"risk_score": 87.0, "risk_level": "HIGH"}, None, None, "Evaluated 4-factor risk score: 87/100 (HIGH)."),
        ("RevivePay AI Agent", RecoveryEventType.AI_DIAGNOSED.value, "AI_AGENT", t_base + datetime.timedelta(seconds=2), None, {"root_cause": "temporary_bank_failure", "confidence": 0.91}, None, None, "AI Root-Cause completed: Temporary Bank Failure (91% confidence)."),
        ("RevivePay AI Agent", RecoveryEventType.ACTION_RECOMMENDED.value, "AI_AGENT", t_base + datetime.timedelta(seconds=2), None, {"recommended_action": "retry_payment"}, None, None, "AI Recommended Action: Single automated gateway retry with backoff."),
        ("RevivePay Policy Gateway", RecoveryEventType.POLICY_PASSED.value, "SYSTEM", t_base + datetime.timedelta(seconds=3), None, None, "PASSED", None, "All 7 deterministic safety and limits rules passed."),
        ("RevivePay Policy Gateway", RecoveryEventType.APPROVAL_REQUESTED.value, "SYSTEM", t_base + datetime.timedelta(seconds=4), None, {"approval_status": "PENDING"}, "PASSED", None, "High-risk threshold triggered. Human-in-the-Loop review requested.")
    ]
    for actor, event_t, act_type, ts, inp, dec, pol, exec_res, notes in canonical_audit_events:
        db.add(AuditLog(
            audit_id=f"aud_{uuid.uuid4().hex[:12]}",
            case_id=killer_case.case_id,
            event_type=event_t,
            actor_type=act_type,
            actor_id=actor,
            timestamp=ts,
            input_data=inp,
            decision=dec,
            policy_result=pol,
            execution_result=exec_res,
            notes=notes,
            actor=actor,
            action=event_t
        ))

    # ==========================================
    # SEED 500+ PAYMENTS & CASES WITH CANONICAL TAXONOMY
    # ==========================================
    failure_types = [
        ("temporary_bank_failure", "BANK_DECLINE", "Issuer switch timed out (504)", 0.35),
        ("insufficient_funds", "INSUFFICIENT_FUNDS", "Declined: Insufficient account balance", 0.25),
        ("card_expired", "CARD_EXPIRED", "Card expiration date passed", 0.15),
        ("network_timeout", "GATEWAY_TIMEOUT", "Network packet dropped at payment gateway", 0.12),
        ("checkout_drop", "ABANDONED_CHECKOUT", "Checkout session expired before payment confirmation", 0.08),
        ("fraud_block", "RISK_SECURITY_BLOCK", "Security flag: card verification mismatch", 0.05)
    ]
    payment_methods = ["card", "upi", "netbanking", "wallet", "emi"]

    case_counter = 10292
    for i in range(1, 520):
        c = random.choice(customers)
        is_failed = random.random() < 0.60
        amt = random.choices([
            random.uniform(499, 2999),
            random.uniform(3000, 9999),
            random.uniform(10000, 45000),
            random.uniform(50000, 95000)
        ], weights=[45, 35, 15, 5])[0]
        amt = round(amt, 2)
        
        created_time = datetime.datetime.utcnow() - datetime.timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        cat, f_code, f_desc, _ = random.choices(failure_types, weights=[w[3] for w in failure_types])[0]
        method = random.choice(payment_methods)
        retry_cnt = random.randint(0, 2)

        p = Payment(
            payment_id=f"pay_{20000 + i}",
            merchant_id=merchant.merchant_id,
            customer_id=c.customer_id,
            provider="razorpay",
            provider_payment_id=f"pay_rzp_{20000 + i}",
            order_id=f"order_{20000 + i}",
            amount=amt,
            currency="INR",
            status="FAILED" if is_failed else "SUCCESS",
            payment_method=method,
            failure_code=f_code if is_failed else None,
            failure_reason=f_desc if is_failed else None,
            failure_category=cat,
            retry_count=retry_cnt,
            max_retry_count=2,
            created_at=created_time,
            updated_at=created_time
        )
        db.add(p)
        db.commit()
        db.refresh(p)

        # Canonical Payment Event
        p_event_type = PaymentEventType.PAYMENT_FAILED.value if is_failed else PaymentEventType.PAYMENT_CAPTURED.value
        db.add(PaymentEvent(
            event_id=f"evt_{20000 + i}",
            provider="razorpay",
            provider_event_id=f"pvt_evt_{20000 + i}",
            event_type=p_event_type,
            payment_id=p.payment_id,
            payload_hash=f"hash_{20000 + i}",
            payload={"amount": int(p.amount * 100), "status": p.status},
            received_at=created_time,
            processed_at=created_time,
            processing_status="PROCESSED"
        ))

        # Seed Recovery Cases for subset
        if is_failed and random.random() < 0.28 and case_counter < 10380:
            score, level, factors = RevenueRiskEngine.calculate_risk(
                amount=p.amount,
                failure_category=p.failure_category,
                total_payments=c.total_successful_payments + c.total_failed_payments,
                successful_payments=c.total_successful_payments,
                failed_payments=c.total_failed_payments,
                retry_count=p.retry_count,
                customer_tier=c.account_tier
            )

            rec_status = random.choice([
                "RECOVERED", "RECOVERED", "AWAITING_APPROVAL", "ACTION_RECOMMENDED", "ESCALATED", "STOPPED"
            ])
            
            if rec_status == "RECOVERED":
                p.status = "SUCCESS"
                is_recovered = True
                recovered_amt = p.amount
                resolved_time = created_time + datetime.timedelta(minutes=4)
                outcome_ver = True
                app_req = False
                app_stat = "APPROVED"
                exec_stat = "COMPLETED"
                audit_event = RecoveryEventType.VERIFIED.value
            elif rec_status == "AWAITING_APPROVAL":
                is_recovered = False
                recovered_amt = 0.0
                resolved_time = None
                outcome_ver = False
                app_req = True
                app_stat = "PENDING"
                exec_stat = "IDLE"
                audit_event = RecoveryEventType.APPROVAL_REQUESTED.value
            elif rec_status == "ESCALATED":
                is_recovered = False
                recovered_amt = 0.0
                resolved_time = created_time + datetime.timedelta(minutes=6)
                outcome_ver = False
                app_req = False
                app_stat = "REJECTED"
                exec_stat = "BLOCKED"
                audit_event = RecoveryEventType.ESCALATED.value
            elif rec_status == "STOPPED":
                is_recovered = False
                recovered_amt = 0.0
                resolved_time = created_time + datetime.timedelta(minutes=3)
                outcome_ver = False
                app_req = False
                app_stat = "AUTO_APPROVED"
                exec_stat = "COMPLETED"
                audit_event = RecoveryEventType.STOPPED.value
            else:
                is_recovered = False
                recovered_amt = 0.0
                resolved_time = None
                outcome_ver = False
                app_req = False
                app_stat = "AUTO_APPROVED"
                exec_stat = "IDLE"
                audit_event = RecoveryEventType.ACTION_RECOMMENDED.value

            action_choice = "retry_payment" if cat == "temporary_bank_failure" else (
                "request_payment_method_update" if cat == "card_expired" else "create_payment_link"
            )

            case_src = "SIMULATION" if (case_counter % 3 == 0) else "RAZORPAY_TEST"
            case_desc = "Synthetic event generated by RevivePay" if case_src == "SIMULATION" else "Event received from Razorpay Test environment"

            # Contextual, distinct evidence & reasoning per customer and case
            evidence_list = [
                f"{c.name} ({c.account_tier} Tier): {c.total_successful_payments} successful past transactions vs {c.total_failed_payments} declines.",
                f"Transaction value ₹{amt:,.2f} assessed with risk score {score:.1f}/100 ({level}).",
                f"Gateway diagnostic: [{f_code}] {p.failure_reason or 'Transient bank switch decline'}"
            ]
            if amt > 50000:
                evidence_list.append(f"High-value policy threshold check applied for ₹{amt:,.2f}.")
                reasoning_txt = f"High-value transaction for {c.name} (₹{amt:,.2f}) evaluated under deterministic governance. Requires explicit operator authorization before capture."
            elif cat == "insufficient_funds":
                evidence_list.append(f"Account funding cycle indicates upcoming liquidity window for {c.name}.")
                reasoning_txt = f"Pre-salary dip detected for {c.name}. Scheduled safe 1-Click WhatsApp recovery link to collect ₹{amt:,.2f} without bank overdraft penalty."
            elif cat == "card_expired":
                evidence_list.append("Card mandate token rejected by network as expired.")
                reasoning_txt = f"Card token invalidation detected for {c.name}. 1-Click WhatsApp payment method update dispatched to preserve recurring subscription."
            else:
                evidence_list.append("Issuer network switch reported transient timeout (504).")
                reasoning_txt = f"Transient gateway switch disconnect detected for {c.name}. Automated retry approved under policy threshold for ₹{amt:,.2f}."

            # Compute RBI TAT deadline
            is_upi = (p.payment_method or "card").lower() == "upi"
            tat_dl = created_time + (datetime.timedelta(days=1) if is_upi else datetime.timedelta(days=7))
            now_dt = datetime.datetime.utcnow()
            
            if ((case_counter in [10294, 10297]) or (case_counter % 7 == 0)) and rec_status not in ["RECOVERED", "STOPPED"]:
                # Seed a breached TAT case
                tat_dl = now_dt - datetime.timedelta(days=random.randint(2, 4))
                days_over = (now_dt - tat_dl).days
                tat_stat = "BREACHED"
                accrued_comp = round(days_over * 100.0, 2)
                pol_stat = "REVIEW_REQUIRED"
                rec_status = "AWAITING_APPROVAL"
                app_req = True
                app_stat = "PENDING"
                exec_stat = "IDLE"
                reasoning_txt = f"Statutory RBI TAT deadline breached by {days_over} days for {c.name}. Escalated to Approval Center with ₹{accrued_comp:,.0f} statutory compensation accrued."
            elif (tat_dl - now_dt) <= datetime.timedelta(hours=24) and (tat_dl >= now_dt):
                tat_stat = "DUE_TODAY"
                accrued_comp = 0.0
                pol_stat = "PASSED" if amt <= 50000 else "REVIEW_REQUIRED"
            else:
                tat_stat = "ON_TRACK"
                accrued_comp = 0.0
                pol_stat = "PASSED" if amt <= 50000 else "REVIEW_REQUIRED"

            rc = RecoveryCase(
                case_id=f"RV-{case_counter}",
                payment_id=p.payment_id,
                customer_id=c.customer_id,
                source=case_src,
                source_description=case_desc,
                case_type="PAYMENT_FAILURE",
                amount_at_risk=p.amount,
                risk_score=score,
                risk_level=level,
                risk_factors=factors,
                root_cause=cat.replace("_", " ").title(),
                ai_confidence=round(random.uniform(0.86, 0.98), 2),
                evidence=evidence_list,
                recommended_action=action_choice,
                reasoning_summary=reasoning_txt,
                policy_status=pol_stat,
                policy_checklist=[
                    {"rule": "action_whitelisted", "description": "Action permitted by policy", "passed": True, "details": "Allowed"},
                    {"rule": "auto_action_amount_limit", "description": "Amount limit check", "passed": amt <= 50000, "details": "Verified"},
                    {"rule": "rbi_tat_guideline_compliance", "description": "RBI Turn Around Time check (RBI/2019-20/67)", "passed": tat_stat != "BREACHED", "details": f"Status: {tat_stat}"}
                ],
                approval_required=app_req,
                approval_status=app_stat,
                execution_status=exec_stat,
                recovery_status=rec_status,
                outcome_verified=outcome_ver,
                recovered_amount=recovered_amt,
                tat_deadline=tat_dl,
                tat_status=tat_stat,
                accrued_compensation_inr=accrued_comp,
                created_at=created_time,
                updated_at=created_time + datetime.timedelta(minutes=random.randint(2, 6), seconds=random.randint(10, 50)),
                resolved_at=resolved_time
            )
            db.add(rc)
            db.commit()
            db.refresh(rc)

            # AgentDecision Entity with staggered second offset
            db.add(AgentDecision(
                decision_id=f"dec_{case_counter}",
                case_id=rc.case_id,
                model_provider="gemini",
                model_name="gemini-1.5-pro",
                prompt_version="v2.1",
                input_version="v1.0",
                root_cause=rc.root_cause,
                confidence=rc.ai_confidence,
                evidence=rc.evidence,
                recommended_action=action_choice,
                decision_timestamp=created_time + datetime.timedelta(seconds=random.randint(4, 18))
            ))

            # PolicyEvaluation Entity with staggered second offset
            db.add(PolicyEvaluation(
                policy_evaluation_id=f"peval_{case_counter}",
                case_id=rc.case_id,
                action=action_choice,
                rules_evaluated=rc.policy_checklist,
                decision=rc.policy_status,
                reason="Policy evaluated successfully with deterministic safety checks.",
                evaluated_at=created_time + datetime.timedelta(seconds=random.randint(19, 35)),
                policy_version="v1.0"
            ))

            # RecoveryAction Entity with staggered minute offset
            if exec_stat in ["COMPLETED", "EXECUTING", "BLOCKED"]:
                db.add(RecoveryAction(
                    action_id=f"act_{case_counter}",
                    case_id=rc.case_id,
                    action_type=action_choice,
                    requested_by="RevivePay Autonomous Engine",
                    policy_decision=rc.policy_status,
                    execution_status=exec_stat,
                    attempt_number=p.retry_count,
                    started_at=created_time + datetime.timedelta(minutes=1, seconds=random.randint(5, 45)),
                    completed_at=resolved_time
                ))

            # Notification Entity with staggered minute offset
            if action_choice in ["send_customer_notification", "create_payment_link", "request_payment_method_update"]:
                db.add(Notification(
                    notification_id=f"notif_{case_counter}",
                    case_id=rc.case_id,
                    customer_id=c.customer_id,
                    channel="email",
                    template="payment_recovery_prompt_v1",
                    message=f"Dispatched recovery action {action_choice} to {c.name}",
                    status="DELIVERED",
                    sent_at=created_time + datetime.timedelta(minutes=2, seconds=random.randint(10, 50))
                ))

            # AuditLog with Canonical Taxonomy and staggered timestamp
            db.add(AuditLog(
                audit_id=f"aud_{case_counter}",
                case_id=rc.case_id,
                event_type=audit_event,
                actor_type="GATEWAY" if is_recovered else "SYSTEM",
                actor_id="Razorpay Gateway Client" if is_recovered else "RevivePay Autonomous Engine",
                timestamp=created_time + datetime.timedelta(seconds=random.randint(36, 58)),
                policy_result=rc.policy_status,
                execution_result="SUCCESS" if is_recovered else ("BLOCKED" if rec_status == "ESCALATED" else "PENDING"),
                decision={
                    "recovered_amount": recovered_amt,
                    "outcome_verified": outcome_ver,
                    "status": rec_status
                },
                notes=f"Recovery state transition: {rec_status} for {c.name}",
                actor="Razorpay Gateway Client" if is_recovered else "RevivePay Autonomous Engine",
                action=audit_event
            ))

            case_counter += 1

    # ==========================================
    # 4. SUBSCRIPTIONS WITH CANONICAL EVENTS
    # ==========================================
    sub_plans = [
        ("Enterprise Monthly Pro", 14999.0),
        ("Team Growth Scale", 7999.0),
        ("Developer SaaS Suite", 2499.0),
        ("Global Infrastructure Plan", 34999.0)
    ]
    for i in range(1, 15):
        c = random.choice(customers)
        plan, cost = random.choice(sub_plans)
        status = random.choice(["ACTIVE", "PAST_DUE", "RECOVERED"])
        afa_req = (cost >= 15000.0)
        has_notified = afa_req and (i % 2 == 0)
        opt_out = (i == 4) # One customer opted out
        
        sub = Subscription(
            subscription_id=f"sub_{80000 + i}",
            customer_id=c.customer_id,
            customer_name=c.name,
            customer_email=c.email,
            plan_name=plan,
            amount=cost,
            currency="INR",
            billing_interval="monthly",
            current_status="HALTED" if opt_out else status,
            retry_count=random.randint(0, 2),
            max_retries=3,
            failure_reason="Customer exercised e-mandate opt-out" if opt_out else ("Transient insufficient funds" if status == "PAST_DUE" else None),
            next_retry_at=datetime.datetime.utcnow() + datetime.timedelta(days=1) if status == "PAST_DUE" and not opt_out else None,
            afa_required=afa_req,
            pre_debit_notification_sent_at=datetime.datetime.utcnow() - datetime.timedelta(hours=26) if has_notified else None,
            opt_out_status=opt_out,
            opt_out_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5) if opt_out else None
        )
        db.add(sub)

        # Canonical Subscription Event
        sub_evt = (
            SubscriptionEventType.SUBSCRIPTION_ACTIVATED.value if status == "ACTIVE"
            else (SubscriptionEventType.SUBSCRIPTION_HALTED.value if status == "PAST_DUE"
            else SubscriptionEventType.SUBSCRIPTION_CHARGED.value)
        )
        db.add(AuditLog(
            audit_id=f"aud_sub_{80000 + i}",
            event_type=sub_evt,
            actor_type="SYSTEM",
            actor_id="Subscription Billing Engine",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(
                days=random.randint(1, 10),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            ),
            decision={"subscription_id": sub.subscription_id, "status": status},
            notes=f"Subscription event: {sub_evt} for {c.name}",
            actor="Subscription Billing Engine",
            action=sub_evt
        ))

    # ==========================================
    # 5. CHECKOUTS WITH CANONICAL EVENTS
    # ==========================================
    cart_catalog = [
        {"name": "Developer Pro Yearly License", "price": 4999.0},
        {"name": "Priority Support Addon", "price": 2000.0},
        {"name": "Enterprise Security Pack", "price": 8999.0},
        {"name": "API Rate Booster (100k)", "price": 1499.0},
    ]
    for i in range(1, 18):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        items = random.sample(cart_catalog, random.randint(1, 3))
        tot = sum(item["price"] for item in items)
        status_choice = random.choice(["ABANDONED", "REMINDED", "RECOVERED"])
        chk = AbandonedCheckout(
            checkout_id=f"chk_{70000 + i}",
            customer_name=f"{fn} {ln}",
            customer_email=f"{fn.lower()}.{ln.lower()}@domain.com",
            cart_items=items,
            total_value=tot,
            currency="INR",
            intent_score=round(random.uniform(70.0, 96.0), 1),
            status=status_choice,
            recovery_action="trigger_checkout_reminder"
        )
        db.add(chk)

        # Canonical Checkout Event
        chk_evt = (
            CheckoutEventType.CHECKOUT_RECOVERED.value if status_choice == "RECOVERED"
            else CheckoutEventType.CHECKOUT_ABANDONED.value
        )
        db.add(AuditLog(
            audit_id=f"aud_chk_{70000 + i}",
            event_type=chk_evt,
            actor_type="SYSTEM",
            actor_id="Checkout Abandonment Engine",
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(
                days=random.randint(1, 5),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            ),
            decision={"checkout_id": chk.checkout_id, "total_value": tot},
            notes=f"Checkout event: {chk_evt} for {fn} {ln}",
            actor="Checkout Abandonment Engine",
            action=chk_evt
        ))

    db.commit()

    # Compute Cryptographic Hash Chain for all Seeded Audit Logs
    all_logs = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()
    from backend.services.audit_service import AuditService, GENESIS_HASH
    prev_h = GENESIS_HASH
    for log_item in all_logs:
        log_item.previous_hash = prev_h
        log_item.entry_hash = AuditService._compute_hash(
            prev_hash=prev_h,
            audit_id=log_item.audit_id,
            timestamp_str=log_item.timestamp.isoformat() if log_item.timestamp else "",
            actor=log_item.actor or "",
            action=log_item.action or log_item.event_type or "",
            case_id=log_item.case_id,
            notes=log_item.notes
        )
        prev_h = log_item.entry_hash

    db.commit()
    db.close()
    print("✅ Canonical Event Taxonomy & Cryptographic Audit Ledger successfully seeded.")

if __name__ == "__main__":
    seed_database(force_reseed=True)
