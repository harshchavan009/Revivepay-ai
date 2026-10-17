"""004_dpdp_compliance_and_security

Revision ID: 7b8c91f034ee
Revises: 5a9c81e237dd
Create Date: 2026-10-18 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7b8c91f034ee'
down_revision: Union[str, Sequence[str], None] = '5a9c81e237dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # 1. Create dpdp_consent_records table
    op.create_table(
        'dpdp_consent_records',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('org_id', sa.String(length=100), nullable=False),
        sa.Column('data_principal_id', sa.String(length=255), nullable=False),
        sa.Column('purpose', sa.String(length=255), nullable=False),
        sa.Column('lawful_basis', sa.String(length=100), server_default='CONSENT', nullable=True),
        sa.Column('status', sa.String(length=50), server_default='ACTIVE', nullable=True),
        sa.Column('retention_period_days', sa.Integer(), server_default='180', nullable=True),
        sa.Column('consent_given_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.org_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dpdp_consent_records_org_id'), 'dpdp_consent_records', ['org_id'], unique=False)
    op.create_index(op.f('ix_dpdp_consent_records_data_principal_id'), 'dpdp_consent_records', ['data_principal_id'], unique=False)

    # 2. Create dpdp_deletion_requests table
    op.create_table(
        'dpdp_deletion_requests',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('org_id', sa.String(length=100), nullable=False),
        sa.Column('requested_by_id', sa.String(length=255), nullable=False),
        sa.Column('data_principal_id', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='REQUESTED', nullable=True),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('erasure_summary', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.org_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dpdp_deletion_requests_org_id'), 'dpdp_deletion_requests', ['org_id'], unique=False)
    op.create_index(op.f('ix_dpdp_deletion_requests_data_principal_id'), 'dpdp_deletion_requests', ['data_principal_id'], unique=False)

    # 3. Add client_ip to audit_logs
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('client_ip', sa.String(length=50), nullable=True))

    # 4. Enable PostgreSQL RLS on new tables if running under postgres
    if is_postgres:
        for tbl in ['dpdp_consent_records', 'dpdp_deletion_requests']:
            op.execute(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;")
            op.execute(
                f"""
                CREATE POLICY {tbl}_tenant_isolation ON {tbl}
                FOR ALL
                USING (org_id = current_setting('app.current_org_id', true));
                """
            )


def downgrade() -> None:
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_column('client_ip')

    op.drop_index(op.f('ix_dpdp_deletion_requests_data_principal_id'), table_name='dpdp_deletion_requests')
    op.drop_index(op.f('ix_dpdp_deletion_requests_org_id'), table_name='dpdp_deletion_requests')
    op.drop_table('dpdp_deletion_requests')

    op.drop_index(op.f('ix_dpdp_consent_records_data_principal_id'), table_name='dpdp_consent_records')
    op.drop_index(op.f('ix_dpdp_consent_records_org_id'), table_name='dpdp_consent_records')
    op.drop_table('dpdp_consent_records')
