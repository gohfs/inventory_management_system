"""API endpoints for warehouse management."""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.infrastructure.database.database import get_db
from src.application.services.warehouse_service import WarehouseService
from src.presentation.schemas.warehouse import (
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseResponse
)
from src.domain.models.user import User
from src.core.dependencies import get_current_user, get_current_super_admin

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.post(
    "/",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new warehouse (Super Admin only)"
)
async def create_warehouse(
    warehouse_data: WarehouseCreate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new warehouse. Requires super admin access.

    Args:
        warehouse_data: Warehouse creation data
        current_user: Current authenticated super admin user
        db: Database session

    Returns:
        Created warehouse data
    """
    service = WarehouseService(db)
    return service.create_warehouse(warehouse_data)


@router.get(
    "/",
    response_model=List[WarehouseResponse],
    summary="Get all warehouses"
)
async def get_warehouses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all warehouses with pagination.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        db: Database session

    Returns:
        List of warehouses
    """
    service = WarehouseService(db)
    return service.get_all_warehouses(skip=skip, limit=limit)


@router.get(
    "/{warehouse_id}",
    response_model=WarehouseResponse,
    summary="Get warehouse by ID"
)
async def get_warehouse(
    warehouse_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific warehouse by ID.

    Args:
        warehouse_id: ID of the warehouse
        current_user: Current authenticated user
        db: Database session

    Returns:
        Warehouse data
    """
    service = WarehouseService(db)
    return service.get_warehouse_by_id(warehouse_id)


@router.put(
    "/{warehouse_id}",
    response_model=WarehouseResponse,
    summary="Update warehouse (Super Admin only)"
)
async def update_warehouse(
    warehouse_id: str,
    warehouse_data: WarehouseUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """
    Update a warehouse. Requires super admin access.

    Args:
        warehouse_id: ID of warehouse to update
        warehouse_data: Updated warehouse data
        current_user: Current authenticated super admin user
        db: Database session

    Returns:
        Updated warehouse data
    """
    service = WarehouseService(db)
    return service.update_warehouse(warehouse_id, warehouse_data)


@router.delete(
    "/{warehouse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete warehouse (Super Admin only)"
)
async def delete_warehouse(
    warehouse_id: str,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a warehouse. Requires super admin access.

    Args:
        warehouse_id: ID of warehouse to delete
        current_user: Current authenticated super admin user
        db: Database session
    """
    service = WarehouseService(db)
    service.delete_warehouse(warehouse_id)
