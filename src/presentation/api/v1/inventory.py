from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.application.services.inventory_service import InventoryService
from src.presentation.schemas.inventory import InventoryItemResponse, InventoryItemCreate, InventoryItemUpdate, InventoryStats
from src.core.dependencies import get_current_user
from src.domain.models.user import User

router = APIRouter(prefix="/inventories", tags=["Inventory"])


@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory statistics for super admin (protected route, requires super admin authentication).
    Shows stats for all warehouses.

    Args:
        db: Database session
        current_user: Current authenticated user (must be super admin)

    Returns:
        Inventory statistics for all warehouses
    """
    service = InventoryService(db)
    return service.get_stats(warehouse_id=None, current_user=current_user)


@router.get("/{warehouse_id}/stats", response_model=InventoryStats)
def get_inventory_stats_by_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory statistics for specific warehouse (protected route, requires warehouse or super admin authentication).
    Warehouse users can only access their own warehouse stats.
    Super admins can access any warehouse stats.

    Args:
        warehouse_id: Warehouse ID to get stats for
        db: Database session
        current_user: Current authenticated user

    Returns:
        Inventory statistics for the specified warehouse
    """
    service = InventoryService(db)
    return service.get_stats(warehouse_id=warehouse_id, current_user=current_user)


@router.get("", response_model=List[InventoryItemResponse])
def get_all_inventory_items(
    warehouse_id: Optional[str] = Query(None, description="Filter items by warehouse ID"),
    category: Optional[str] = Query(None, description="Filter items by category"),
    min_stock: Optional[int] = Query(None, ge=0, description="Filter items by minimum stock level"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all inventory items (protected route, requires authentication).
    Warehouse users see items from their warehouse only.
    Super admins see items from all warehouses.
    Supports filtering by warehouse_id, category, and minimum stock level.

    Args:
        warehouse_id: Optional warehouse ID to filter items by
        category: Optional category to filter items by
        min_stock: Optional minimum stock level to filter items by
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of inventory items
    """
    service = InventoryService(db)
    if warehouse_id:
        # If warehouse_id is provided, get items for that specific warehouse with filtering
        return service.get_items_by_warehouse(
            warehouse_id,
            category=category,
            min_stock=min_stock,
            current_user=current_user
        )
    else:
        # Otherwise, get all items with optional filtering
        return service.get_all_items(
            skip=skip,
            limit=limit,
            category=category,
            min_stock=min_stock,
            current_user=current_user
        )


@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory item by ID (protected route, requires authentication).
    Warehouse users can only access items from their warehouse.

    Args:
        item_id: ID of inventory item to retrieve
        db: Database session
        current_user: Current authenticated user

    Returns:
        Inventory item data
    """
    service = InventoryService(db)
    return service.get_item_by_id(item_id, current_user=current_user)


@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new inventory item (protected route, requires authentication).
    Warehouse users can only create items for their warehouse.

    Args:
        item_data: Inventory item creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created inventory item data
    """
    service = InventoryService(db)
    return service.create_item(item_data, current_user=current_user)


@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: str,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update inventory item information (protected route, requires authentication).
    Warehouse users can only update items from their warehouse.

    Args:
        item_id: ID of inventory item to update
        item_data: Updated inventory item data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated inventory item data
    """
    service = InventoryService(db)
    return service.update_item(item_id, item_data, current_user=current_user)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete inventory item (protected route, requires authentication).
    Warehouse users can only delete items from their warehouse.

    Args:
        item_id: ID of inventory item to delete
        db: Database session
        current_user: Current authenticated user

    Returns:
        204 No Content
    """
    service = InventoryService(db)
    service.delete_item(item_id, current_user=current_user)
    return None


@router.get("/category/{category}", response_model=List[InventoryItemResponse])
def get_inventory_items_by_category(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory items by category (protected route, requires authentication).
    Warehouse users see items from their warehouse only.

    Args:
        category: Category to filter items by
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of inventory items in the specified category
    """
    service = InventoryService(db)
    return service.get_items_by_category(category, current_user=current_user)


@router.get("/search/{search_term}", response_model=List[InventoryItemResponse])
def search_inventory_items(
    search_term: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search inventory items by name or description (protected route, requires authentication).
    Warehouse users see items from their warehouse only.

    Args:
        search_term: Term to search for in item names or descriptions
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of matching inventory items
    """
    service = InventoryService(db)
    return service.search_items(search_term, current_user=current_user)


@router.get("/warehouse/{warehouse_id}", response_model=List[InventoryItemResponse])
def get_inventory_items_by_warehouse(
    warehouse_id: str,
    category: Optional[str] = Query(None, description="Filter items by category"),
    min_stock: Optional[int] = Query(None, ge=0, description="Filter items by minimum stock level"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory items by warehouse (protected route, requires authentication).
    Warehouse users can only access their own warehouse inventory.
    Supports filtering by category and minimum stock level.

    Args:
        warehouse_id: Warehouse ID to filter items by
        category: Optional category to filter items by
        min_stock: Optional minimum stock level to filter items by
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of inventory items in the specified warehouse
    """
    service = InventoryService(db)
    return service.get_items_by_warehouse(
        warehouse_id,
        category=category,
        min_stock=min_stock,
        current_user=current_user
    )


@router.put("/warehouse/{warehouse_id}/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item_by_warehouse(
    warehouse_id: str,
    item_id: str,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update inventory item by warehouse (protected route, requires authentication).

    Args:
        warehouse_id: Warehouse ID the item belongs to
        item_id: ID of inventory item to update
        item_data: Updated inventory item data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated inventory item data
    """
    service = InventoryService(db)
    return service.update_item(item_id, item_data, current_user=current_user)


@router.get("/warehouse/{warehouse_id}/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item_by_warehouse(
    warehouse_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory item by warehouse ID and inventory ID (protected route, requires authentication).

    Args:
        warehouse_id: Warehouse ID the item belongs to
        item_id: ID of inventory item to retrieve
        db: Database session
        current_user: Current authenticated user

    Returns:
        Inventory item data
    """
    service = InventoryService(db)
    return service.get_item_by_warehouse_and_id(warehouse_id, item_id, current_user=current_user)


@router.delete("/warehouse/{warehouse_id}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item_by_warehouse(
    warehouse_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete inventory item by warehouse (protected route, requires authentication).
    Only items with zero stock can be deleted.

    Args:
        warehouse_id: Warehouse ID the item belongs to
        item_id: ID of inventory item to delete
        db: Database session
        current_user: Current authenticated user

    Returns:
        204 No Content
    """
    service = InventoryService(db)
    service.delete_item(item_id, current_user=current_user)
    return None