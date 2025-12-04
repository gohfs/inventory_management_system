"""add_sell_transactions_and_activities_tables

Revision ID: c7f8d9e1a2b3
Revises: 08fe8c0b4a33
Create Date: 2025-12-04 21:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c7f8d9e1a2b3'
down_revision: Union[str, None] = '08fe8c0b4a33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ActivityType enum
    activity_type_enum = postgresql.ENUM(
        'INVENTORY_CREATED', 'INVENTORY_UPDATED', 'INVENTORY_DELETED', 'INVENTORY_STOCK_ADJUSTED',
        'WAREHOUSE_CREATED', 'WAREHOUSE_UPDATED', 'WAREHOUSE_DELETED',
        'SELL_TRANSACTION',
        'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
        name='activitytype',
        create_type=False
    )
    activity_type_enum.create(op.get_bind(), checkfirst=True)

    # Create sell_transactions table
    op.create_table(
        'sell_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('warehouse_id', sa.String(), nullable=False),
        sa.Column('inventory_item_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sell_transactions_inventory_item_id'), 'sell_transactions', ['inventory_item_id'], unique=False)
    op.create_index(op.f('ix_sell_transactions_user_id'), 'sell_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_sell_transactions_warehouse_id'), 'sell_transactions', ['warehouse_id'], unique=False)

    # Create activities table
    op.create_table(
        'activities',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('activity_type', postgresql.ENUM(
            'INVENTORY_CREATED', 'INVENTORY_UPDATED', 'INVENTORY_DELETED', 'INVENTORY_STOCK_ADJUSTED',
            'WAREHOUSE_CREATED', 'WAREHOUSE_UPDATED', 'WAREHOUSE_DELETED',
            'SELL_TRANSACTION',
            'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
            name='activitytype',
            create_type=False
        ), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activities_activity_type'), 'activities', ['activity_type'], unique=False)
    op.create_index(op.f('ix_activities_entity_id'), 'activities', ['entity_id'], unique=False)
    op.create_index(op.f('ix_activities_user_id'), 'activities', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop activities table
    op.drop_index(op.f('ix_activities_user_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_entity_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_activity_type'), table_name='activities')
    op.drop_table('activities')

    # Drop sell_transactions table
    op.drop_index(op.f('ix_sell_transactions_warehouse_id'), table_name='sell_transactions')
    op.drop_index(op.f('ix_sell_transactions_user_id'), table_name='sell_transactions')
    op.drop_index(op.f('ix_sell_transactions_inventory_item_id'), table_name='sell_transactions')
    op.drop_table('sell_transactions')

    # Drop ActivityType enum
    activity_type_enum = postgresql.ENUM(name='activitytype')
    activity_type_enum.drop(op.get_bind(), checkfirst=True)
