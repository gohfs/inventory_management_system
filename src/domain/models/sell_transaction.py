from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.infrastructure.database.database import Base
import uuid


class SellTransaction(Base):
    """Sell transaction domain model."""

    __tablename__ = "sell_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    warehouse_id = Column(String, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_item_id = Column(String, ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    warehouse = relationship("Warehouse")
    inventory_item = relationship("InventoryItem")
    user = relationship("User")

    def __repr__(self):
        return f"<SellTransaction(id={self.id}, warehouse_id={self.warehouse_id}, inventory_item_id={self.inventory_item_id}, quantity={self.quantity})>"
