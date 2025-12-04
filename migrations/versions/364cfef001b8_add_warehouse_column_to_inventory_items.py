"""add_warehouse_column_to_inventory_items

Revision ID: 364cfef001b8
Revises: 
Create Date: 2025-12-03 05:40:19.371826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '364cfef001b8'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add warehouse column to inventory_items table
    op.add_column('inventory_items', sa.Column('warehouse', sa.String(), nullable=False, default='main'))


def downgrade() -> None:
    # Remove warehouse column from inventory_items table
    op.drop_column('inventory_items', 'warehouse')
