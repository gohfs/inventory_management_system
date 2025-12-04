"""add_description_column_to_warehouses

Revision ID: eb3e2dbf5366
Revises: 86598ce53e47
Create Date: 2025-12-03 08:10:25.643505

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb3e2dbf5366'
down_revision: Union[str, None] = '86598ce53e47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add description column to warehouses table
    op.add_column('warehouses', sa.Column('description', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove description column from warehouses table
    op.drop_column('warehouses', 'description')
