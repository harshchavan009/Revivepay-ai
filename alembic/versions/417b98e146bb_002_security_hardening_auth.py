"""002_security_hardening_auth

Revision ID: 417b98e146bb
Revises: 306a87d235aa
Create Date: 2026-10-12 18:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '417b98e146bb'
down_revision: Union[str, Sequence[str], None] = '306a87d235aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add account lockout columns to users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('failed_login_attempts', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))

    # 2. Create revoked_tokens table for server-side token invalidation
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('token_type', sa.String(length=20), server_default='refresh', nullable=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revoked_tokens_token_hash'), 'revoked_tokens', ['token_hash'], unique=True)

    # 3. Create password_reset_tokens table for secure credential resets
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), server_default='0', nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_tokens_token_hash'), 'password_reset_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_password_reset_tokens_token_hash'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

    op.drop_index(op.f('ix_revoked_tokens_token_hash'), table_name='revoked_tokens')
    op.drop_table('revoked_tokens')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('locked_until')
        batch_op.drop_column('failed_login_attempts')
