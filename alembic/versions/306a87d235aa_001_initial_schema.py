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
    """Upgrade schema."""
    from backend.database import Base
    import backend.models.all_models
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Downgrade schema."""
    from backend.database import Base
    import backend.models.all_models
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
