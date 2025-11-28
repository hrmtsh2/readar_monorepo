"""add_rental_duration_fields

Revision ID: a218df3e5484
Revises: 789abc123def
Create Date: 2025-11-28 17:10:47.414396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a218df3e5484'
down_revision: Union[str, Sequence[str], None] = '789abc123def'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
