from sqlalchemy import Column, String, Enum as SQLEnum, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.infrastructure.database.database import Base
import uuid
import enum


class ActivityType(str, enum.Enum):
    """Activity type enumeration."""
    # Inventory activities
    INVENTORY_CREATED = "inventory_created"
    INVENTORY_UPDATED = "inventory_updated"
    INVENTORY_DELETED = "inventory_deleted"
    INVENTORY_STOCK_ADJUSTED = "inventory_stock_adjusted"

    # Warehouse activities
    WAREHOUSE_CREATED = "warehouse_created"
    WAREHOUSE_UPDATED = "warehouse_updated"
    WAREHOUSE_DELETED = "warehouse_deleted"

    # Transaction activities
    SELL_TRANSACTION = "sell_transaction"

    # User activities
    USER_LOGIN = "user_login"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"


class Activity(Base):
    """Activity tracking domain model."""

    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_type = Column(SQLEnum(ActivityType), nullable=False, index=True)
    entity_type = Column(String, nullable=False)  # "inventory", "warehouse", "sell_transaction", "user"
    entity_id = Column(String, nullable=True, index=True)  # ID of the affected entity
    description = Column(Text, nullable=False)
    meta_data = Column("metadata", JSON, nullable=True)  # Additional context data (renamed from metadata to avoid SQLAlchemy conflict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<Activity(id={self.id}, user_id={self.user_id}, activity_type={self.activity_type}, entity_type={self.entity_type})>"
