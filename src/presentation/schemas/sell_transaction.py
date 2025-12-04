from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SellTransactionCreate(BaseModel):
    """Schema for creating a sell transaction."""
    warehouse_id: str = Field(..., description="Warehouse ID")
    inventory_item_id: str = Field(..., description="Inventory item ID")
    quantity: int = Field(..., gt=0, description="Quantity to sell (must be positive)")
    description: Optional[str] = Field(None, description="Transaction description")


class SellTransactionResponse(BaseModel):
    """Schema for sell transaction response."""
    id: str
    warehouse_id: str
    inventory_item_id: str
    user_id: Optional[str]
    quantity: int
    unit_price: float
    total_price: float
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SellTransactionListResponse(BaseModel):
    """Schema for listing sell transactions."""
    success: bool = True
    data: list[SellTransactionResponse]
    total: int
    error: Optional[str] = None
