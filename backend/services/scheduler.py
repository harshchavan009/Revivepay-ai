import asyncio
import random
import uuid
import datetime
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.all_models import Payment, Customer, Merchant, RecoveryCase
from backend.services.recovery_engine import RecoveryEngine

logger = logging.getLogger("revivepay.scheduler")

SAMPLE_CUSTOMERS = [
    ("cust_synth_01", "Zomato Enterprise Services", "enterprise@zomato.in", "VIP"),
    ("cust_synth_02", "Swiggy Daily Cloud Kitchens", "billing@swiggy.in", "ENTERPRISE"),
    ("cust_synth_03", "Razorpay X Payout Hub", "finance@razorpayx.in", "VIP"),
    ("cust_synth_04", "Zepto Superfast Logistics", "accounts@zepto.in", "MID_MARKET"),
    ("cust_synth_05", "CRED Premium Club", "ops@cred.club", "VIP"),
    ("cust_synth_06", "Urban Company Pro Services", "payments@urbancompany.com", "RETURNING"),
]

FAILURE_REASONS = [
    ("temporary_bank_failure", "BANK_DECLINE", "Issuer switch timed out during peak settlement queue"),
    ("gateway_switch_timeout", "GATEWAY_TIMEOUT", "National payment switch delayed response under queue load"),
    ("insufficient_funds_transient", "INSUFFICIENT_FUNDS", "Pre-salary window transient low balance; retry recommended"),
    ("card_network_congestion", "NETWORK_ERROR", "NPCI card routing switch congestion resolved"),
]

def generate_synthetic_telemetry_tick(db: Session) -> Dict[str, Any]:
    """
    Simulates a live transaction failure and processes it through the
    autonomous recovery pipeline, ensuring dashboard numbers move over time.
    """
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="Apex Cloud Services", industry="Fintech & SaaS")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    # Pick or seed sample customer
    ext_id, name, email, tier = random.choice(SAMPLE_CUSTOMERS)
    customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer:
        customer = Customer(
            customer_id=f"cust_{uuid.uuid4().hex[:8]}",
            merchant_id=merchant.merchant_id,
            external_customer_id=ext_id,
            name=name,
            email=email,
            account_tier=tier,
            total_successful_payments=random.randint(5, 45),
            total_failed_payments=random.randint(0, 3),
            lifetime_value=random.uniform(50000, 350000),
            consent_status=True
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # Random realistic amount
    amount = round(random.choice([2499.0, 4999.0, 8999.0, 14500.0, 28000.0, 52000.0]), 2)
    failure_category, failure_code, failure_reason = random.choice(FAILURE_REASONS)
    pay_id = f"pay_syn_{uuid.uuid4().hex[:8]}"

    payment = Payment(
        payment_id=pay_id,
        merchant_id=merchant.merchant_id,
        customer_id=customer.customer_id,
        amount=amount,
        currency="INR",
        status="FAILED",
        failure_category=failure_category,
        failure_code=failure_code,
        failure_reason=failure_reason,
        payment_method=random.choice(["card", "upi", "netbanking"]),
        source="SIMULATION",
        retry_count=0,
        max_retry_count=2,
        created_at=datetime.datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Ingest through the 7-stage autonomous recovery pipeline
    case = RecoveryEngine.process_payment_failure(
        db=db,
        payment=payment,
        customer=customer,
        merchant=merchant
    )

    logger.info(f"⚡ Synthetic Telemetry Tick: Created case {case.case_id} for ₹{amount:,.2f} ({case.recovery_status})")
    return {
        "status": "success",
        "case_id": case.case_id,
        "amount": amount,
        "customer": name,
        "recovery_status": case.recovery_status,
        "policy_status": case.policy_status
    }

async def periodic_telemetry_loop(interval_seconds: int = 1800):
    """
    Background asynchronous loop generating synthetic telemetry ticks periodically
    and evaluating statutory RBI TAT deadlines.
    """
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            db = SessionLocal()
            try:
                # 1. Evaluate TAT deadlines & statutory compensation
                RecoveryEngine.check_and_update_tat_statuses(db)
                # 2. Ingest synthetic telemetry tick
                generate_synthetic_telemetry_tick(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("🛑 Background telemetry scheduler stopped.")
            break
        except Exception as e:
            logger.error(f"Error in telemetry scheduler loop: {e}")
            await asyncio.sleep(60)
