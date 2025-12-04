from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.application.services.sell_transaction_service import SellTransactionService
from src.presentation.schemas.sell_transaction import (
    SellTransactionCreate,
    SellTransactionResponse
)
from src.core.dependencies import get_current_user
from src.domain.models.user import User

router = APIRouter(prefix="/sell", tags=["Sell Transactions"])


@router.post("", response_model=SellTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_sell_transaction(
    transaction_data: SellTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new sell transaction (Super Admin only).

    This endpoint:
    - Validates that only super admin users can create sell transactions
    - Checks that the warehouse and inventory item exist
    - Validates that the inventory item belongs to the specified warehouse
    - Ensures sufficient stock is available
    - Creates the sell transaction record
    - Immediately updates the inventory stock (no approval or payment waiting required)
    - Logs activities for tracking

    Args:
        transaction_data: Sell transaction data (warehouse_id, inventory_item_id, quantity, description)
        db: Database session
        current_user: Current authenticated user (must be super admin)

    Returns:
        Created sell transaction with details

    Raises:
        403: If user is not a super admin
        404: If warehouse or inventory item not found
        400: If inventory item doesn't belong to warehouse or insufficient stock
    """
    service = SellTransactionService(db)
    return service.create_sell_transaction(transaction_data, current_user)


@router.get("", response_model=List[SellTransactionResponse])
def get_all_sell_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all sell transactions with pagination (Protected route).

    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of sell transactions
    """
    service = SellTransactionService(db)
    return service.get_all_transactions(skip=skip, limit=limit)


@router.get("/warehouse/{warehouse_id}", response_model=List[SellTransactionResponse])
def get_transactions_by_warehouse(
    warehouse_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all sell transactions for a specific warehouse (Protected route).

    Args:
        warehouse_id: ID of the warehouse
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of sell transactions for the specified warehouse
    """
    service = SellTransactionService(db)
    return service.get_transactions_by_warehouse(warehouse_id=warehouse_id, skip=skip, limit=limit)


@router.get("/inventory/{inventory_item_id}", response_model=List[SellTransactionResponse])
def get_transactions_by_inventory_item(
    inventory_item_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all sell transactions for a specific inventory item (Protected route).

    Args:
        inventory_item_id: ID of the inventory item
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of sell transactions for the specified inventory item
    """
    service = SellTransactionService(db)
    return service.get_transactions_by_inventory_item(inventory_item_id=inventory_item_id, skip=skip, limit=limit)
