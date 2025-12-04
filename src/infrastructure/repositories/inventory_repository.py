from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.domain.models.inventory import InventoryItem
from src.presentation.schemas.inventory import InventoryItemCreate, InventoryItemUpdate


class InventoryRepository:
    """Repository for InventoryItem data access operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: str) -> Optional[InventoryItem]:
        """Get inventory item by ID."""
        return self.db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

    def get_by_sku(self, sku: str) -> Optional[InventoryItem]:
        """Get inventory item by SKU."""
        return self.db.query(InventoryItem).filter(InventoryItem.sku == sku).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        min_stock: Optional[int] = None
    ) -> List[InventoryItem]:
        """
        Get all inventory items with pagination and filtering.
        Warehouse filtering is now handled in the frontend.

        Args:
            skip: Number of items to skip
            limit: Maximum number of items to return
            category: Optional category to filter by
            min_stock: Optional minimum stock level to filter by

        Returns:
            List of all inventory items
        """
        query = self.db.query(InventoryItem)

        # Apply category filter if provided
        if category:
            query = query.filter(InventoryItem.category == category)

        # Apply minimum stock filter if provided
        if min_stock is not None:
            query = query.filter(InventoryItem.quantity >= min_stock)

        return query.offset(skip).limit(limit).all()

    def create(self, item_data: InventoryItemCreate) -> InventoryItem:
        """
        Create a new inventory item.

        Args:
            item_data: Inventory item creation data

        Returns:
            Created inventory item instance

        Raises:
            ValueError: If warehouse_id is not provided
        """
        # Validate that warehouse_id is provided
        if not item_data.warehouse_id:
            raise ValueError("warehouse_id is required for inventory item creation")
        
        db_item = InventoryItem(**item_data.model_dump())
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def update(self, item_id: str, item_data: InventoryItemUpdate) -> Optional[InventoryItem]:
        """
        Update an existing inventory item.

        Args:
            item_id: ID of inventory item to update
            item_data: Updated inventory item data

        Returns:
            Updated inventory item instance or None if not found
        """
        db_item = self.get_by_id(item_id)
        if not db_item:
            return None

        update_data = item_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_item, field, value)

        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def delete(self, item_id: str) -> bool:
        """
        Delete an inventory item.

        Args:
            item_id: ID of inventory item to delete

        Returns:
            True if deleted, False if not found
        """
        db_item = self.get_by_id(item_id)
        if not db_item:
            return False

        self.db.delete(db_item)
        self.db.commit()
        return True

    def get_stats(self, warehouse_id: Optional[str] = None) -> dict:
        """
        Get inventory statistics.

        Args:
            warehouse_id: Optional warehouse ID to filter statistics

        Returns:
            Dictionary with inventory statistics
        """
        query = self.db.query(InventoryItem)
        if warehouse_id:
            query = query.filter(InventoryItem.warehouse_id == warehouse_id)

        total_items = query.with_entities(func.count(InventoryItem.id)).scalar()

        # Count items with low stock (quantity < min_stock_level)
        low_stock_count = query.filter(
            InventoryItem.quantity < InventoryItem.min_stock_level
        ).with_entities(func.count(InventoryItem.id)).scalar()

        # Count distinct categories
        total_categories = query.with_entities(func.count(func.distinct(InventoryItem.category))).scalar()

        # Count distinct warehouses (only if not filtering by warehouse)
        if warehouse_id:
            total_warehouses = 1
        else:
            total_warehouses = self.db.query(func.count(func.distinct(InventoryItem.warehouse_id))).scalar()

        # Calculate total value (sum of quantity * buy_price)
        total_value = query.with_entities(
            func.sum(InventoryItem.quantity * InventoryItem.buy_price)
        ).scalar() or 0.0

        return {
            "total_items": total_items,
            "low_stock_items": low_stock_count,
            "total_categories": total_categories,
            "total_warehouses": total_warehouses,
            "total_value": total_value
        }

    def get_items_by_category(self, category: str, warehouse_id: Optional[str] = None) -> List[InventoryItem]:
        """
        Get all inventory items in a specific category.

        Args:
            category: Category to filter by
            warehouse_id: Optional warehouse ID to filter by

        Returns:
            List of inventory items
        """
        query = self.db.query(InventoryItem).filter(InventoryItem.category == category)
        if warehouse_id:
            query = query.filter(InventoryItem.warehouse_id == warehouse_id)
        return query.all()

    def search_items(self, search_term: str, warehouse_id: Optional[str] = None) -> List[InventoryItem]:
        """
        Search inventory items by name or description.

        Args:
            search_term: Term to search for
            warehouse_id: Optional warehouse ID to filter by

        Returns:
            List of inventory items
        """
        query = self.db.query(InventoryItem).filter(
            InventoryItem.name.contains(search_term) |
            InventoryItem.description.contains(search_term)
        )
        if warehouse_id:
            query = query.filter(InventoryItem.warehouse_id == warehouse_id)
        return query.all()

    def get_items_by_warehouse(
        self,
        warehouse_id: str,
        category: Optional[str] = None,
        min_stock: Optional[int] = None
    ) -> List[InventoryItem]:
        """
        Get all inventory items in a specific warehouse with optional filtering.

        Args:
            warehouse_id: Warehouse ID to filter by
            category: Optional category to filter by
            min_stock: Optional minimum stock level to filter by

        Returns:
            List of inventory items
        """
        query = self.db.query(InventoryItem).filter(InventoryItem.warehouse_id == warehouse_id)

        # Apply category filter if provided
        if category:
            query = query.filter(InventoryItem.category == category)

        # Apply minimum stock filter if provided
        if min_stock is not None:
            query = query.filter(InventoryItem.quantity >= min_stock)

        return query.all()

    def exists_by_sku(self, sku: str) -> bool:
        """Check if an inventory item with given SKU exists."""
        return self.db.query(InventoryItem).filter(InventoryItem.sku == sku).first() is not None

    def get_by_warehouse_and_id(self, warehouse_id: str, item_id: str) -> Optional[InventoryItem]:
        """
        Get inventory item by warehouse ID and item ID.

        Args:
            warehouse_id: Warehouse ID to filter by
            item_id: Item ID to filter by

        Returns:
            Inventory item instance or None if not found
        """
        return self.db.query(InventoryItem).filter(
            InventoryItem.warehouse_id == warehouse_id,
            InventoryItem.id == item_id
        ).first()