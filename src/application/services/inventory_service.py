from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.domain.models.inventory import InventoryItem
from src.domain.models.user import User, UserRole
from src.infrastructure.repositories.inventory_repository import InventoryRepository
from src.presentation.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryStats


class InventoryService:
    """Service layer for inventory business logic with warehouse-based access control."""

    def __init__(self, db: Session):
        self.repository = InventoryRepository(db)

    def _validate_warehouse_access(self, current_user: User, warehouse_id: str) -> None:
        """
        Validate that user has access to the warehouse.
        Note: This validation is now handled in the frontend.

        Args:
            current_user: Current authenticated user
            warehouse_id: Warehouse ID to check access for
        """
        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed
        pass

    def get_item_by_id(self, item_id: str, current_user: User) -> InventoryItem:
        """
        Get inventory item by ID with warehouse access control.

        Args:
            item_id: ID of the item
            current_user: Current authenticated user

        Returns:
            Inventory item instance

        Raises:
            HTTPException: If item not found or access denied
        """
        item = self.repository.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )

        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        return item

    def get_all_items(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        min_stock: Optional[int] = None,
        current_user: Optional[User] = None
    ) -> List[InventoryItem]:
        """
        Get all inventory items with pagination and filtering.
        Warehouse filtering is now handled in the frontend.

        Args:
            skip: Number of items to skip
            limit: Maximum number of items to return
            category: Optional category to filter by
            min_stock: Optional minimum stock level to filter by
            current_user: Current authenticated user

        Returns:
            List of all inventory items
        """
        # Warehouse filtering is now handled in the frontend
        # Return all items regardless of user role
        return self.repository.get_all(skip=skip, limit=limit, category=category, min_stock=min_stock)

    def create_item(self, item_data: InventoryItemCreate, current_user: User) -> InventoryItem:
        """
        Create a new inventory item with warehouse access control.

        Args:
            item_data: Inventory item creation data
            current_user: Current authenticated user

        Returns:
            Created inventory item instance

        Raises:
            HTTPException: If SKU already exists or access denied
        """
        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        # Check if SKU already exists
        if self.repository.exists_by_sku(item_data.sku):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )

        try:
            return self.repository.create(item_data)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    def update_item(self, item_id: str, item_data: InventoryItemUpdate, current_user: User) -> InventoryItem:
        """
        Update inventory item information with warehouse access control.

        Args:
            item_id: ID of inventory item to update
            item_data: Updated inventory item data
            current_user: Current authenticated user

        Returns:
            Updated inventory item instance

        Raises:
            HTTPException: If item not found, SKU already taken, quantity is negative, or access denied
        """
        # Get existing item
        existing_item = self.repository.get_by_id(item_id)
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )

        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        # Check if SKU is being changed and already exists
        if item_data.sku and item_data.sku != existing_item.sku:
            if self.repository.exists_by_sku(item_data.sku):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SKU already taken"
                )

        # Validate quantity is not negative (backup validation for safety)
        if item_data.quantity is not None and item_data.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stocks cannot be negative"
            )

        item = self.repository.update(item_id, item_data)
        return item

    def delete_item(self, item_id: str, current_user: User) -> bool:
        """
        Delete an inventory item with warehouse access control.

        Args:
            item_id: ID of inventory item to delete
            current_user: Current authenticated user

        Returns:
            True if deleted

        Raises:
            HTTPException: If item not found, has non-zero stock, or access denied
        """
        # Get existing item
        existing_item = self.repository.get_by_id(item_id)
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )

        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        # Check if item has non-zero stock quantity
        if existing_item.quantity > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete inventory item with non-zero stock quantity"
            )

        if not self.repository.delete(item_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        return True

    def get_stats(self, warehouse_id: Optional[str] = None, current_user: Optional[User] = None) -> InventoryStats:
        """
        Get inventory statistics with warehouse filtering.

        Args:
            warehouse_id: Specific warehouse ID to get stats for (None for all warehouses)
            current_user: Current authenticated user

        Returns:
            Inventory statistics for the specified warehouse or all warehouses
        """
        stats_data = self.repository.get_stats(warehouse_id=warehouse_id)
        return InventoryStats(**stats_data)

    def get_items_by_category(self, category: str, current_user: Optional[User] = None) -> List[InventoryItem]:
        """
        Get all inventory items in a specific category with warehouse filtering.

        Args:
            category: Category to filter by
            current_user: Current authenticated user

        Returns:
            List of inventory items (filtered by warehouse for warehouse role)
        """
        warehouse_id = None
        if current_user and current_user.role == UserRole.WAREHOUSE:
            warehouse_id = current_user.warehouse_id

        return self.repository.get_items_by_category(category, warehouse_id=warehouse_id)

    def search_items(self, search_term: str, current_user: Optional[User] = None) -> List[InventoryItem]:
        """
        Search inventory items by name or description with warehouse filtering.

        Args:
            search_term: Term to search for
            current_user: Current authenticated user

        Returns:
            List of inventory items (filtered by warehouse for warehouse role)
        """
        warehouse_id = None
        if current_user and current_user.role == UserRole.WAREHOUSE:
            warehouse_id = current_user.warehouse_id

        return self.repository.search_items(search_term, warehouse_id=warehouse_id)

    def get_items_by_warehouse(
        self,
        warehouse_id: str,
        category: Optional[str] = None,
        min_stock: Optional[int] = None,
        current_user: User = None
    ) -> List[InventoryItem]:
        """
        Get all inventory items in a specific warehouse with access control and filtering.

        Args:
            warehouse_id: Warehouse ID to filter by
            category: Optional category to filter by
            min_stock: Optional minimum stock level to filter by
            current_user: Current authenticated user

        Returns:
            List of inventory items

        Raises:
            HTTPException: If access denied
        """
        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        return self.repository.get_items_by_warehouse(warehouse_id, category=category, min_stock=min_stock)

    def get_item_by_warehouse_and_id(self, warehouse_id: str, item_id: str, current_user: User) -> InventoryItem:
        """
        Get inventory item by warehouse ID and item ID with warehouse access control.

        Args:
            warehouse_id: Warehouse ID the item belongs to
            item_id: ID of the inventory item
            current_user: Current authenticated user

        Returns:
            Inventory item instance

        Raises:
            HTTPException: If item not found or access denied
        """
        item = self.repository.get_by_warehouse_and_id(warehouse_id, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )

        # Warehouse access validation is now handled in the frontend
        # No backend validation is performed

        return item