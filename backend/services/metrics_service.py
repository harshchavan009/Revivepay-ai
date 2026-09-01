import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.all_models import Payment, RecoveryCase, Customer

class MetricsService:
    @classmethod
    def get_dashboard_summary(cls, db: Session) -> Dict[str, Any]:
        # 1. Total Failed Payments
        failed_count = db.query(Payment).filter(Payment.status.in_(["FAILED", "PENDING"])).count()
        
        # 2. Revenue At Risk (sum of unrecovered failed payments)
        risk_sum = db.query(func.sum(RecoveryCase.amount_at_risk)).filter(
            RecoveryCase.recovery_status.in_([
                "NEW", "ANALYZING", "ACTION_RECOMMENDED", "AWAITING_APPROVAL", "APPROVED", "EXECUTING", "FAILED", "ESCALATED"
            ])
        ).scalar() or 0.0

        # 3. Recovered Revenue
        recovered_sum = db.query(func.sum(RecoveryCase.recovered_amount)).filter(
            RecoveryCase.recovery_status == "RECOVERED"
        ).scalar() or 0.0

        # 4. Active Recovery Cases (all non-terminal in-flight states)
        active_count = db.query(RecoveryCase).filter(
            RecoveryCase.recovery_status.in_([
                "NEW", "ANALYZING", "ACTION_RECOMMENDED", "AWAITING_APPROVAL",
                "APPROVED", "AUTO_APPROVED", "EXECUTING", "VERIFYING", "REASSESS"
            ])
        ).count()

        # 5. Escalated Cases
        escalated_count = db.query(RecoveryCase).filter(
            RecoveryCase.recovery_status == "ESCALATED"
        ).count()

        # 6. Awaiting Approval Count
        approval_count = db.query(RecoveryCase).filter(
            RecoveryCase.approval_status == "PENDING"
        ).count()

        # 7. Total Cases Count
        total_cases = db.query(RecoveryCase).count()

        # Calculate dynamic Recovery Rate %
        total_impact = risk_sum + recovered_sum
        recovery_rate = round((recovered_sum / max(1.0, total_impact)) * 100.0, 1) if total_impact > 0 else 0.0

        # Dynamic average recovery time in minutes
        recovered_cases = db.query(RecoveryCase).filter(
            RecoveryCase.recovery_status == "RECOVERED",
            RecoveryCase.resolved_at.isnot(None),
            RecoveryCase.created_at.isnot(None)
        ).all()
        time_diffs = [
            (c.resolved_at - c.created_at).total_seconds() / 60.0
            for c in recovered_cases
            if c.resolved_at and c.created_at and c.resolved_at > c.created_at
        ]
        avg_recovery_time = round(sum(time_diffs) / len(time_diffs), 1) if time_diffs else 0.0

        # Dynamic retry success rate & autonomous recovery rate
        total_recovered_cases = len(recovered_cases)
        total_resolved_cases = db.query(RecoveryCase).filter(
            RecoveryCase.recovery_status.in_(["RECOVERED", "FAILED", "ESCALATED", "STOPPED", "REJECTED"])
        ).count()
        retry_success_rate = round((total_recovered_cases / max(1, total_resolved_cases)) * 100.0, 1) if total_resolved_cases > 0 else 0.0

        auto_approved_recovered = db.query(RecoveryCase).filter(
            RecoveryCase.recovery_status == "RECOVERED",
            RecoveryCase.approval_status == "AUTO_APPROVED"
        ).count()
        autonomous_recovery_rate = round((auto_approved_recovered / max(1, total_recovered_cases)) * 100.0, 1) if total_recovered_cases > 0 else 0.0

        return {
            "revenue_at_risk": round(risk_sum, 2),
            "recovered_revenue": round(recovered_sum, 2),
            "recovery_rate": recovery_rate,
            "failed_payments_count": failed_count,
            "active_recovery_count": active_count,
            "escalated_cases_count": escalated_count,
            "awaiting_approval_count": approval_count,
            "total_cases_count": total_cases,
            "average_recovery_time_minutes": avg_recovery_time,
            "retry_success_rate": retry_success_rate,
            "autonomous_recovery_rate": autonomous_recovery_rate
        }

    @classmethod
    def get_revenue_risk_trend(cls, db: Session) -> List[Dict[str, Any]]:
        days_data = db.query(
            func.date(RecoveryCase.created_at).label("day"),
            func.sum(RecoveryCase.amount_at_risk).label("risk"),
            func.sum(RecoveryCase.recovered_amount).label("recovered")
        ).group_by(func.date(RecoveryCase.created_at)).order_by(func.date(RecoveryCase.created_at).desc()).limit(7).all()

        days_data_ordered = list(reversed(days_data))
        trend = []
        for day_str, risk, rec in days_data_ordered:
            r_val = float(risk or 0.0)
            rec_val = float(rec or 0.0)
            total = r_val + rec_val
            rate = round((rec_val / max(1.0, total)) * 100.0, 1) if total > 0 else 0.0
            try:
                dt = datetime.datetime.strptime(str(day_str), "%Y-%m-%d")
                day_label = dt.strftime("%a")
            except Exception:
                day_label = str(day_str)

            trend.append({
                "date": day_label,
                "full_date": str(day_str),
                "revenue_at_risk": round(r_val, 2),
                "recovered_revenue": round(rec_val, 2),
                "rate": rate
            })
        return trend

    @classmethod
    def get_failure_reasons(cls, db: Session) -> List[Dict[str, Any]]:
        reasons = db.query(
            Payment.failure_category,
            func.count(Payment.payment_id).label("count"),
            func.sum(Payment.amount).label("total_amount")
        ).group_by(Payment.failure_category).all()

        total_failures = sum(count for _, count, _ in reasons) or 1
        results = []
        labels = {
            "temporary_bank_failure": "Bank Gateway Disconnect",
            "insufficient_funds": "Insufficient Balance",
            "card_expired": "Card Expired / Token Void",
            "checkout_drop": "Abandoned Checkout",
            "network_timeout": "Network Timeout",
            "fraud_block": "Risk / Security Block"
        }
        for category, count, total_amt in reasons:
            pct = round((count / total_failures) * 100.0, 1)
            results.append({
                "category": category or "temporary_bank_failure",
                "label": labels.get(category, (category or "Unknown").replace("_", " ").title()),
                "name": labels.get(category, (category or "Unknown").replace("_", " ").title()),
                "count": count,
                "amount": round(total_amt or 0.0, 2),
                "percentage": pct,
                "value": pct
            })

        return results

    @classmethod
    def get_recovery_funnel(cls, db: Session) -> List[Dict[str, Any]]:
        total_failures = db.query(Payment).count()
        analyzed = db.query(RecoveryCase).count()
        policies_passed = db.query(RecoveryCase).filter(RecoveryCase.policy_status == "PASSED").count()
        actions_executed = db.query(RecoveryCase).filter(RecoveryCase.execution_status.in_(["EXECUTING", "COMPLETED"])).count()
        recovered = db.query(RecoveryCase).filter(RecoveryCase.recovery_status == "RECOVERED").count()

        dropoff_1 = "0%"
        dropoff_2 = f"{round(((total_failures - analyzed) / max(1, total_failures)) * 100.0, 1)}%" if total_failures > 0 else "0%"
        dropoff_3 = f"{round(((analyzed - policies_passed) / max(1, analyzed)) * 100.0, 1)}%" if analyzed > 0 else "0%"
        dropoff_4 = f"{round(((policies_passed - actions_executed) / max(1, policies_passed)) * 100.0, 1)}%" if policies_passed > 0 else "0%"
        dropoff_5 = f"{round(((actions_executed - recovered) / max(1, actions_executed)) * 100.0, 1)}%" if actions_executed > 0 else "0%"

        return [
            {"stage": "1. Failure Detected", "count": total_failures, "dropoff": dropoff_1},
            {"stage": "2. AI Diagnosed", "count": analyzed, "dropoff": dropoff_2},
            {"stage": "3. Policy Validated", "count": policies_passed, "dropoff": dropoff_3},
            {"stage": "4. Action Dispatched", "count": actions_executed, "dropoff": dropoff_4},
            {"stage": "5. Revenue Recovered", "count": recovered, "dropoff": dropoff_5}
        ]
