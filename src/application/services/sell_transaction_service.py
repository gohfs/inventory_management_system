from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.domain.models.sell_transaction import SellTransaction
from src.domain.models.activity import ActivityType
from src.domain.models.user import User, UserRole
from src.infrastructure.repositories.sell_transaction_repository import SellTransactionRepository
from src.infrastructure.repositories.inventory_repository import InventoryRepository
from src.infrastructure.repositories.warehouse_repository import WarehouseRepository
from src.application.services.activity_service import ActivityService
from src.presentation.schemas.sell_transaction import SellTransactionCreate


class SellTransactionService:
    """Service for managing sell transaction operations."""

    def __init__(self, db: Session):
        self.db = db
        self.sell_transaction_repository = SellTransactionRepository(db)
        self.inventory_repository = InventoryRepository(db)
        self.warehouse_repository = WarehouseRepository(db)
        self.activity_service = ActivityService(db)

    def create_sell_transaction(
        self,
        transaction_data: SellTransactionCreate,
        current_user: User
    ) -> SellTransaction:
        """
        Create a new sell transaction.
        Only super admin users can create sell transactions.
        This will immediately update the inventory stock.

        Args:
            transaction_data: Sell transaction creation data
            current_user: Current authenticated user

        Returns:
            Created sell transaction instance

        Raises:
            HTTPException: If user is not super admin, warehouse not found, inventory item not found,
                          insufficient stock, or inventory item doesn't belong to warehouse
        """
        # Validate user role - only super admin can sell
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admin users can create sell transactions"
            )

        # Validate warehouse exists
        warehouse = self.warehouse_repository.get_by_id(transaction_data.warehouse_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Warehouse with ID {transaction_data.warehouse_id} not found"
            )

        # Validate inventory item exists
        inventory_item = self.inventory_repository.get_by_id(transaction_data.inventory_item_id)
        if not inventory_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item with ID {transaction_data.inventory_item_id} not found"
            )

        # Validate inventory item belongs to the specified warehouse
        if inventory_item.warehouse_id != transaction_data.warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory item does not belong to warehouse {transaction_data.warehouse_id}"
            )

        # Validate sufficient stock
        if inventory_item.quantity < transaction_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {inventory_item.quantity}, Requested: {transaction_data.quantity}"
            )

        # Calculate prices
        unit_price = inventory_item.sell_price
        total_price = unit_price * transaction_data.quantity

        # Create sell transaction
        sell_transaction = SellTransaction(
            warehouse_id=transaction_data.warehouse_id,
            inventory_item_id=transaction_data.inventory_item_id,
            user_id=current_user.id,
            quantity=transaction_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
            description=transaction_data.description
        )
        created_transaction = self.sell_transaction_repository.create(sell_transaction)

        # Update inventory stock immediately
        new_quantity = inventory_item.quantity - transaction_data.quantity
        inventory_item.quantity = new_quantity
        self.db.commit()
        self.db.refresh(inventory_item)

        # Log activity for sell transaction
        self.activity_service.log_activity(
            user_id=current_user.id,
            activity_type=ActivityType.SELL_TRANSACTION,
            entity_type="sell_transaction",
            entity_id=created_transaction.id,
            description=f"Sold {transaction_data.quantity} units of {inventory_item.name} from {warehouse.name}",
            metadata={
                "warehouse_id": transaction_data.warehouse_id,
                "warehouse_name": warehouse.name,
                "inventory_item_id": transaction_data.inventory_item_id,
                "inventory_item_name": inventory_item.name,
                "quantity": transaction_data.quantity,
                "unit_price": unit_price,
                "total_price": total_price,
                "previous_stock": inventory_item.quantity + transaction_data.quantity,
                "new_stock": inventory_item.quantity
            }
        )

        # Log activity for inventory stock adjustment
        self.activity_service.log_activity(
            user_id=current_user.id,
            activity_type=ActivityType.INVENTORY_STOCK_ADJUSTED,
            entity_type="inventory",
            entity_id=inventory_item.id,
            description=f"Stock reduced by {transaction_data.quantity} units due to sale. New stock: {inventory_item.quantity}",
            metadata={
                "warehouse_id": transaction_data.warehouse_id,
                "warehouse_name": warehouse.name,
                "inventory_item_name": inventory_item.name,
                "quantity_change": -transaction_data.quantity,
                "previous_stock": inventory_item.quantity + transaction_data.quantity,
                "new_stock": inventory_item.quantity,
                "transaction_id": created_transaction.id
            }
        )

        return created_transaction

    def get_all_transactions(self, skip: int = 0, limit: int = 100) -> List[SellTransaction]:
        """Get all sell transactions with pagination."""
        return self.sell_transaction_repository.get_all(skip=skip, limit=limit)

    def get_transactions_by_warehouse(
        self,
        warehouse_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[SellTransaction]:
        """Get all sell transactions for a specific warehouse."""
        return self.sell_transaction_repository.get_by_warehouse_id(
            warehouse_id=warehouse_id,
            skip=skip,
            limit=limit
        )

    def get_transactions_by_inventory_item(
        self,
        inventory_item_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[SellTransaction]:
        """Get all sell transactions for a specific inventory item."""
        return self.sell_transaction_repository.get_by_inventory_item_id(
            inventory_item_id=inventory_item_id,
            skip=skip,
            limit=limit
        )
