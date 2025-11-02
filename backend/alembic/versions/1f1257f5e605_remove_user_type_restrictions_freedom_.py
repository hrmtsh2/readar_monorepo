"""remove_user_type_restrictions_freedom_for_all

Revision ID: 1f1257f5e605
Revises: ea19ac9b67c6
Create Date: 2025-09-11 18:33:37.168032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f1257f5e605'
down_revision: Union[str, Sequence[str], None] = '426e17b48559'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
