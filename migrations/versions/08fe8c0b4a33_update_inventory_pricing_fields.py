"""update_inventory_pricing_fields

Revision ID: 08fe8c0b4a33
Revises: eb3e2dbf5366
Create Date: 2025-12-04 11:21:40.349107

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08fe8c0b4a33'
down_revision: Union[str, None] = 'eb3e2dbf5366'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns
    op.add_column('inventory_items', sa.Column('buy_price', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('inventory_items', sa.Column('sell_price', sa.Float(), nullable=False, server_default='0.0'))

    # Copy data from unit_price to buy_price and calculate sell_price
    op.execute('''
        UPDATE inventory_items
        SET buy_price = unit_price,
            sell_price = unit_price * 1.2
        WHERE unit_price IS NOT NULL
    ''')

    # Drop old column
    op.drop_column('inventory_items', 'unit_price')


def downgrade() -> None:
    # Add back unit_price column
    op.add_column('inventory_items', sa.Column('unit_price', sa.Float(), nullable=False, server_default='0.0'))

    # Copy data from buy_price back to unit_price
    op.execute('''
        UPDATE inventory_items
        SET unit_price = buy_price
        WHERE buy_price IS NOT NULL
    ''')

    # Drop new columns
    op.drop_column('inventory_items', 'sell_price')
    op.drop_column('inventory_items', 'buy_price')
