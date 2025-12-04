from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.models.sell_transaction import SellTransaction


class SellTransactionRepository:
    """Repository for managing sell transaction data access."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, sell_transaction: SellTransaction) -> SellTransaction:
        """Create a new sell transaction."""
        self.db.add(sell_transaction)
        self.db.commit()
        self.db.refresh(sell_transaction)
        return sell_transaction

    def get_by_id(self, transaction_id: str) -> Optional[SellTransaction]:
        """Get a sell transaction by ID."""
        return self.db.query(SellTransaction).filter(SellTransaction.id == transaction_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[SellTransaction]:
        """Get all sell transactions with pagination."""
        return self.db.query(SellTransaction).order_by(SellTransaction.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_warehouse_id(self, warehouse_id: str, skip: int = 0, limit: int = 100) -> List[SellTransaction]:
        """Get all sell transactions for a specific warehouse."""
        return self.db.query(SellTransaction).filter(
            SellTransaction.warehouse_id == warehouse_id
        ).order_by(SellTransaction.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_inventory_item_id(self, inventory_item_id: str, skip: int = 0, limit: int = 100) -> List[SellTransaction]:
        """Get all sell transactions for a specific inventory item."""
        return self.db.query(SellTransaction).filter(
            SellTransaction.inventory_item_id == inventory_item_id
        ).order_by(SellTransaction.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[SellTransaction]:
        """Get all sell transactions created by a specific user."""
        return self.db.query(SellTransaction).filter(
            SellTransaction.user_id == user_id
        ).order_by(SellTransaction.created_at.desc()).offset(skip).limit(limit).all()
