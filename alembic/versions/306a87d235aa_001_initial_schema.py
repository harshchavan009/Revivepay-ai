"""001_initial_schema

Revision ID: 306a87d235aa
Revises: 
Create Date: 2026-08-30 23:39:47.243632

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '306a87d235aa'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema using explicit Alembic DDL operations."""
    op.create_table(
        'abandoned_checkouts',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('checkout_id', sa.String(length=100), nullable=False),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=False),
        sa.Column('cart_items', sa.JSON(), nullable=True),
        sa.Column('total_value', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('intent_score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('recovery_action', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_abandoned_checkouts_checkout_id'), 'abandoned_checkouts', ['checkout_id'], unique=True)

    op.create_table(
        'merchants',
        sa.Column('merchant_id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('auto_recovery_enabled', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('razorpay_key_id', sa.String(length=100), nullable=True),
        sa.Column('razorpay_key_secret', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('merchant_id')
    )

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('subscription_id', sa.String(length=100), nullable=False),
        sa.Column('customer_id', sa.String(length=100), nullable=False),
        sa.Column('customer_name', sa.String(length=255), nullable=True),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('plan_name', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('billing_interval', sa.String(length=50), nullable=True),
        sa.Column('current_status', sa.String(length=50), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retries', sa.Integer(), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('next_retry_at', sa.DateTime(), nullable=True),
        sa.Column('afa_required', sa.Boolean(), nullable=True),
        sa.Column('pre_debit_notification_sent_at', sa.DateTime(), nullable=True),
        sa.Column('opt_out_status', sa.Boolean(), nullable=True),
        sa.Column('opt_out_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_subscription_id'), 'subscriptions', ['subscription_id'], unique=True)

    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('signature', sa.String(length=255), nullable=True),
        sa.Column('processed', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webhook_events_event_id'), 'webhook_events', ['event_id'], unique=True)

    op.create_table(
        'customers',
        sa.Column('customer_id', sa.String(length=100), nullable=False),
        sa.Column('merchant_id', sa.String(length=100), nullable=False),
        sa.Column('external_customer_id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('account_tier', sa.String(length=50), nullable=True),
        sa.Column('total_successful_payments', sa.Integer(), nullable=True),
        sa.Column('total_failed_payments', sa.Integer(), nullable=True),
        sa.Column('lifetime_value', sa.Float(), nullable=True),
        sa.Column('last_successful_payment_at', sa.DateTime(), nullable=True),
        sa.Column('consent_status', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.merchant_id'], ),
        sa.PrimaryKeyConstraint('customer_id')
    )
    op.create_index(op.f('ix_customers_external_customer_id'), 'customers', ['external_customer_id'], unique=True)

    op.create_table(
        'policy_configs',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('merchant_id', sa.String(length=100), nullable=False),
        sa.Column('max_auto_retries', sa.Integer(), nullable=True),
        sa.Column('max_auto_amount', sa.Float(), nullable=True),
        sa.Column('high_value_approval_threshold', sa.Float(), nullable=True),
        sa.Column('min_ai_confidence', sa.Float(), nullable=True),
        sa.Column('allow_customer_contact', sa.Boolean(), nullable=True),
        sa.Column('recovery_time_window_hours', sa.Integer(), nullable=True),
        sa.Column('mandate_afa_threshold', sa.Float(), nullable=True),
        sa.Column('tat_auto_escalate', sa.Boolean(), nullable=True),
        sa.Column('allowed_actions', sa.JSON(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.merchant_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id')
    )

    op.create_table(
        'users',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('merchant_id', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('theme_preference', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.merchant_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table(
        'chat_threads',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_threads_session_id'), 'chat_threads', ['session_id'], unique=False)

    op.create_table(
        'payments',
        sa.Column('payment_id', sa.String(length=100), nullable=False),
        sa.Column('merchant_id', sa.String(length=100), nullable=False),
        sa.Column('customer_id', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('provider_payment_id', sa.String(length=100), nullable=True),
        sa.Column('order_id', sa.String(length=100), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('failure_code', sa.String(length=100), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('failure_category', sa.String(length=100), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('max_retry_count', sa.Integer(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('source_description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], ),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.merchant_id'], ),
        sa.PrimaryKeyConstraint('payment_id')
    )
    op.create_index(op.f('ix_payments_created_at'), 'payments', ['created_at'], unique=False)
    op.create_index(op.f('ix_payments_status'), 'payments', ['status'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('thread_id', sa.String(length=100), nullable=False),
        sa.Column('sender', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tool_calls', sa.JSON(), nullable=True),
        sa.Column('citations', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['thread_id'], ['chat_threads.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'payment_events',
        sa.Column('event_id', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_event_id', sa.String(length=100), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('payment_id', sa.String(length=100), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('source_description', sa.String(length=255), nullable=True),
        sa.Column('raw_webhook_body', sa.Text(), nullable=True),
        sa.Column('signature', sa.String(length=255), nullable=True),
        sa.Column('payload_hash', sa.String(length=255), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('processing_status', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.payment_id'], ),
        sa.PrimaryKeyConstraint('event_id'),
        sa.UniqueConstraint('provider', 'provider_event_id', name='uq_provider_event_id')
    )
    op.create_index(op.f('ix_payment_events_provider_event_id'), 'payment_events', ['provider_event_id'], unique=False)

    op.create_table(
        'recovery_cases',
        sa.Column('case_id', sa.String(length=100), nullable=False),
        sa.Column('payment_id', sa.String(length=100), nullable=False),
        sa.Column('customer_id', sa.String(length=100), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('source_description', sa.String(length=255), nullable=True),
        sa.Column('case_type', sa.String(length=100), nullable=True),
        sa.Column('amount_at_risk', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('failure_type', sa.String(length=100), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=True),
        sa.Column('risk_level', sa.String(length=50), nullable=True),
        sa.Column('risk_factors', sa.JSON(), nullable=True),
        sa.Column('root_cause', sa.String(length=255), nullable=True),
        sa.Column('ai_confidence', sa.Float(), nullable=True),
        sa.Column('evidence', sa.JSON(), nullable=True),
        sa.Column('recommended_action', sa.String(length=100), nullable=True),
        sa.Column('reasoning_summary', sa.Text(), nullable=True),
        sa.Column('policy_status', sa.String(length=50), nullable=True),
        sa.Column('policy_checklist', sa.JSON(), nullable=True),
        sa.Column('approval_required', sa.Boolean(), nullable=True),
        sa.Column('approval_status', sa.String(length=50), nullable=True),
        sa.Column('rejection_reason', sa.String(length=255), nullable=True),
        sa.Column('approved_by', sa.String(length=255), nullable=True),
        sa.Column('execution_status', sa.String(length=50), nullable=True),
        sa.Column('recovery_status', sa.String(length=50), nullable=True),
        sa.Column('outcome_verified', sa.Boolean(), nullable=True),
        sa.Column('recovered_amount', sa.Float(), nullable=True),
        sa.Column('tat_deadline', sa.DateTime(), nullable=True),
        sa.Column('tat_status', sa.String(length=50), nullable=True),
        sa.Column('accrued_compensation_inr', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], ),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.payment_id'], ),
        sa.PrimaryKeyConstraint('case_id'),
        sa.UniqueConstraint('payment_id')
    )
    op.create_index(op.f('ix_recovery_cases_created_at'), 'recovery_cases', ['created_at'], unique=False)
    op.create_index(op.f('ix_recovery_cases_recovery_status'), 'recovery_cases', ['recovery_status'], unique=False)

    op.create_table(
        'agent_decisions',
        sa.Column('decision_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=False),
        sa.Column('model_provider', sa.String(length=50), nullable=True),
        sa.Column('model_name', sa.String(length=100), nullable=True),
        sa.Column('prompt_version', sa.String(length=50), nullable=True),
        sa.Column('input_version', sa.String(length=50), nullable=True),
        sa.Column('root_cause', sa.String(length=255), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('evidence', sa.JSON(), nullable=True),
        sa.Column('recommended_action', sa.String(length=100), nullable=False),
        sa.Column('reasoning_narrative', sa.Text(), nullable=True),
        sa.Column('prompt_raw', sa.Text(), nullable=True),
        sa.Column('response_raw', sa.Text(), nullable=True),
        sa.Column('decision_timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.PrimaryKeyConstraint('decision_id')
    )

    op.create_table(
        'approvals',
        sa.Column('approval_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=False),
        sa.Column('requested_action', sa.String(length=100), nullable=False),
        sa.Column('risk_level', sa.String(length=50), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=True),
        sa.Column('requested_by', sa.String(length=100), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('decision', sa.String(length=50), nullable=True),
        sa.Column('decision_reason', sa.Text(), nullable=True),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.PrimaryKeyConstraint('approval_id')
    )

    op.create_table(
        'audit_logs',
        sa.Column('audit_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('source_description', sa.String(length=255), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('actor_type', sa.String(length=50), nullable=True),
        sa.Column('actor_id', sa.String(length=100), nullable=True),
        sa.Column('before_state', sa.JSON(), nullable=True),
        sa.Column('after_state', sa.JSON(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('entry_hash', sa.String(length=64), nullable=True),
        sa.Column('previous_hash', sa.String(length=64), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=True),
        sa.Column('actor', sa.String(length=100), nullable=True),
        sa.Column('policy_result', sa.String(length=50), nullable=True),
        sa.Column('execution_result', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('input_data', sa.JSON(), nullable=True),
        sa.Column('decision', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.PrimaryKeyConstraint('audit_id')
    )
    op.create_index(op.f('ix_audit_logs_entry_hash'), 'audit_logs', ['entry_hash'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)

    op.create_table(
        'notifications',
        sa.Column('notification_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=True),
        sa.Column('customer_id', sa.String(length=100), nullable=False),
        sa.Column('channel', sa.String(length=50), nullable=True),
        sa.Column('template', sa.String(length=100), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('provider_reference', sa.String(length=100), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], ),
        sa.PrimaryKeyConstraint('notification_id')
    )

    op.create_table(
        'policy_evaluations',
        sa.Column('policy_evaluation_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('rules_evaluated', sa.JSON(), nullable=True),
        sa.Column('decision', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('evaluated_at', sa.DateTime(), nullable=True),
        sa.Column('policy_version', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.PrimaryKeyConstraint('policy_evaluation_id')
    )

    op.create_table(
        'recovery_actions',
        sa.Column('action_id', sa.String(length=100), nullable=False),
        sa.Column('case_id', sa.String(length=100), nullable=False),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('requested_by', sa.String(length=100), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('policy_decision', sa.String(length=50), nullable=True),
        sa.Column('execution_status', sa.String(length=50), nullable=True),
        sa.Column('provider_reference', sa.String(length=100), nullable=True),
        sa.Column('attempt_number', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('error_code', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['recovery_cases.case_id'], ),
        sa.PrimaryKeyConstraint('action_id')
    )


def downgrade() -> None:
    """Downgrade schema using explicit drop commands."""
    op.drop_table('recovery_actions')
    op.drop_table('policy_evaluations')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_entry_hash'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_table('approvals')
    op.drop_table('agent_decisions')
    op.drop_index(op.f('ix_recovery_cases_recovery_status'), table_name='recovery_cases')
    op.drop_index(op.f('ix_recovery_cases_created_at'), table_name='recovery_cases')
    op.drop_table('recovery_cases')
    op.drop_index(op.f('ix_payment_events_provider_event_id'), table_name='payment_events')
    op.drop_table('payment_events')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_payments_status'), table_name='payments')
    op.drop_index(op.f('ix_payments_created_at'), table_name='payments')
    op.drop_table('payments')
    op.drop_index(op.f('ix_chat_threads_session_id'), table_name='chat_threads')
    op.drop_table('chat_threads')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('policy_configs')
    op.drop_index(op.f('ix_customers_external_customer_id'), table_name='customers')
    op.drop_table('customers')
    op.drop_index(op.f('ix_webhook_events_event_id'), table_name='webhook_events')
    op.drop_table('webhook_events')
    op.drop_index(op.f('ix_subscriptions_subscription_id'), table_name='subscriptions')
    op.drop_table('subscriptions')
    op.drop_table('merchants')
    op.drop_index(op.f('ix_abandoned_checkouts_checkout_id'), table_name='abandoned_checkouts')
    op.drop_table('abandoned_checkouts')
