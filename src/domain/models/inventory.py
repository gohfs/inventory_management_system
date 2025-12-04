from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.infrastructure.database.database import Base
import uuid


class InventoryItem(Base):
    """Inventory item domain model."""

    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    warehouse_id = Column(String, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    buy_price = Column(Float, nullable=False, default=0.0)
    sell_price = Column(Float, nullable=False, default=0.0)
    category = Column(String, nullable=True)
    min_stock_level = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    warehouse = relationship("Warehouse", back_populates="inventory_items")

    def __repr__(self):
        return f"<InventoryItem(id={self.id}, name={self.name}, sku={self.sku}, warehouse_id={self.warehouse_id})>"

    @property
    def is_low_stock(self) -> bool:
        """Check if item is below minimum stock level."""
        return self.quantity < self.min_stock_level

    @property
    def total_value(self) -> float:
        """Calculate total value of inventory item (stock × buy_price)."""
        return self.quantity * self.buy_price