"""add_rental_duration_fields

Revision ID: 789abc123def
Revises: 216658c1d629
Create Date: 2025-01-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '789abc123def'
down_revision: Union[str, Sequence[str], None] = '216658c1d629'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add rental duration columns to reservations table
    op.add_column('reservations', sa.Column('rental_weeks', sa.Integer(), nullable=True))
    op.add_column('reservations', sa.Column('rental_start_date', sa.DateTime(), nullable=True))
    op.add_column('reservations', sa.Column('due_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove rental duration columns from reservations table
    op.drop_column('reservations', 'due_date')
    op.drop_column('reservations', 'rental_start_date')
    op.drop_column('reservations', 'rental_weeks')
