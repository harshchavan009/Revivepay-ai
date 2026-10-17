"""003_real_auth_and_multitenancy

Revision ID: 5a9c81e237dd
Revises: 417b98e146bb
Create Date: 2026-10-18 00:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5a9c81e237dd'
down_revision: Union[str, Sequence[str], None] = '417b98e146bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # 1. Create organizations table
    op.create_table(
        'organizations',
        sa.Column('org_id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('is_test_mode', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('currency', sa.String(length=10), server_default='INR', nullable=True),
        sa.Column('timezone', sa.String(length=50), server_default='Asia/Kolkata', nullable=True),
        sa.Column('auto_recovery_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('razorpay_key_id', sa.String(length=100), nullable=True),
        sa.Column('razorpay_key_secret', sa.Text(), nullable=True),
        sa.Column('webhook_secret', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('org_id')
    )
    op.create_index(op.f('ix_organizations_slug'), 'organizations', ['slug'], unique=True)

    # 2. Create email_verification_tokens table
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_verification_tokens_token_hash'), 'email_verification_tokens', ['token_hash'], unique=True)

    # 3. Add MFA and verification columns to users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('org_id', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        batch_op.add_column(sa.Column('mfa_enabled', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        batch_op.add_column(sa.Column('mfa_secret', sa.String(length=255), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_org_id'), ['org_id'], unique=False)

    # 4. Add org_id to all domain tables
    domain_tables = [
        'merchants', 'customers', 'payments', 'payment_events',
        'recovery_cases', 'agent_decisions', 'recovery_actions',
        'policy_evaluations', 'approvals', 'audit_logs',
        'notifications', 'policy_configs', 'subscriptions',
        'abandoned_checkouts', 'chat_threads', 'webhook_events'
    ]

    for tbl in domain_tables:
        with op.batch_alter_table(tbl, schema=None) as batch_op:
            batch_op.add_column(sa.Column('org_id', sa.String(length=100), nullable=True))
            batch_op.create_index(batch_op.f(f'ix_{tbl}_org_id'), ['org_id'], unique=False)

    # 5. Enable Row-Level Security for PostgreSQL
    if is_postgres:
        rls_tables = ['payments', 'recovery_cases', 'customers', 'audit_logs', 'subscriptions', 'abandoned_checkouts', 'policy_configs']
        for rls_tbl in rls_tables:
            op.execute(f"ALTER TABLE {rls_tbl} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"DROP POLICY IF EXISTS {rls_tbl}_tenant_isolation ON {rls_tbl};")
            op.execute(f"""
                CREATE POLICY {rls_tbl}_tenant_isolation ON {rls_tbl}
                USING (org_id = NULLIF(current_setting('app.current_org_id', true), ''));
            """)


def downgrade() -> None:
    domain_tables = [
        'merchants', 'customers', 'payments', 'payment_events',
        'recovery_cases', 'agent_decisions', 'recovery_actions',
        'policy_evaluations', 'approvals', 'audit_logs',
        'notifications', 'policy_configs', 'subscriptions',
        'abandoned_checkouts', 'chat_threads', 'webhook_events'
    ]
    for tbl in domain_tables:
        with op.batch_alter_table(tbl, schema=None) as batch_op:
            batch_op.drop_index(batch_op.f(f'ix_{tbl}_org_id'))
            batch_op.drop_column('org_id')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_org_id'))
        batch_op.drop_column('mfa_secret')
        batch_op.drop_column('mfa_enabled')
        batch_op.drop_column('is_verified')
        batch_op.drop_column('org_id')

    op.drop_index(op.f('ix_email_verification_tokens_token_hash'), table_name='email_verification_tokens')
    op.drop_table('email_verification_tokens')

    op.drop_index(op.f('ix_organizations_slug'), table_name='organizations')
    op.drop_table('organizations')
