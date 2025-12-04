from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.domain.models.warehouse import Warehouse
from src.infrastructure.repositories.warehouse_repository import WarehouseRepository
from src.presentation.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseService:
    """Service layer for warehouse business logic."""

    def __init__(self, db: Session):
        self.repository = WarehouseRepository(db)

    def create_warehouse(self, warehouse_data: WarehouseCreate) -> Warehouse:
        """
        Create a new warehouse.

        Args:
            warehouse_data: Warehouse creation data

        Returns:
            Created warehouse instance

        Raises:
            HTTPException: If warehouse name already exists
        """
        if self.repository.exists_by_name(warehouse_data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Warehouse name already exists"
            )

        return self.repository.create(warehouse_data)

    def get_warehouse_by_id(self, warehouse_id: str) -> Warehouse:
        """
        Get warehouse by ID.

        Args:
            warehouse_id: ID of the warehouse

        Returns:
            Warehouse instance

        Raises:
            HTTPException: If warehouse not found
        """
        warehouse = self.repository.get_by_id(warehouse_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
        return warehouse

    def get_all_warehouses(self, skip: int = 0, limit: int = 100) -> List[Warehouse]:
        """
        Get all warehouses with pagination.

        Args:
            skip: Number of items to skip
            limit: Maximum number of items to return

        Returns:
            List of warehouses
        """
        return self.repository.get_all(skip=skip, limit=limit)

    def update_warehouse(self, warehouse_id: str, warehouse_data: WarehouseUpdate) -> Warehouse:
        """
        Update warehouse information.

        Args:
            warehouse_id: ID of warehouse to update
            warehouse_data: Updated warehouse data

        Returns:
            Updated warehouse instance

        Raises:
            HTTPException: If warehouse not found or name already taken
        """
        # Check if name is being changed and already exists
        if warehouse_data.name:
            existing_warehouse = self.repository.get_by_name(warehouse_data.name)
            if existing_warehouse and existing_warehouse.id != warehouse_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Warehouse name already taken"
                )

        warehouse = self.repository.update(warehouse_id, warehouse_data)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
        return warehouse

    def delete_warehouse(self, warehouse_id: str) -> bool:
        """
        Delete a warehouse.

        Args:
            warehouse_id: ID of warehouse to delete

        Returns:
            True if deleted

        Raises:
            HTTPException: If warehouse not found
        """
        if not self.repository.delete(warehouse_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
        return True
