from typing import Optional, List
from sqlalchemy.orm import Session
from src.domain.models.warehouse import Warehouse
from src.presentation.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseRepository:
    """Repository for Warehouse data access operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, warehouse_id: str) -> Optional[Warehouse]:
        """Get warehouse by ID."""
        return self.db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()

    def get_by_name(self, name: str) -> Optional[Warehouse]:
        """Get warehouse by name."""
        return self.db.query(Warehouse).filter(Warehouse.name == name).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Warehouse]:
        """Get all warehouses with pagination."""
        return self.db.query(Warehouse).offset(skip).limit(limit).all()

    def create(self, warehouse_data: WarehouseCreate) -> Warehouse:
        """
        Create a new warehouse.

        Args:
            warehouse_data: Warehouse creation data

        Returns:
            Created warehouse instance
        """
        db_warehouse = Warehouse(
            name=warehouse_data.name,
            location=warehouse_data.location,
            description=warehouse_data.description
        )
        self.db.add(db_warehouse)
        self.db.commit()
        self.db.refresh(db_warehouse)
        return db_warehouse

    def update(self, warehouse_id: str, warehouse_data: WarehouseUpdate) -> Optional[Warehouse]:
        """
        Update an existing warehouse.

        Args:
            warehouse_id: ID of warehouse to update
            warehouse_data: Updated warehouse data

        Returns:
            Updated warehouse instance or None if not found
        """
        db_warehouse = self.get_by_id(warehouse_id)
        if not db_warehouse:
            return None

        update_data = warehouse_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_warehouse, field, value)

        self.db.commit()
        self.db.refresh(db_warehouse)
        return db_warehouse

    def delete(self, warehouse_id: str) -> bool:
        """
        Delete a warehouse.

        Args:
            warehouse_id: ID of warehouse to delete

        Returns:
            True if deleted, False if not found
        """
        db_warehouse = self.get_by_id(warehouse_id)
        if not db_warehouse:
            return False

        self.db.delete(db_warehouse)
        self.db.commit()
        return True

    def exists_by_name(self, name: str) -> bool:
        """Check if a warehouse with given name exists."""
        return self.db.query(Warehouse).filter(Warehouse.name == name).first() is not None
