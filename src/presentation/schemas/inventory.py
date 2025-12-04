from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class InventoryItemBase(BaseModel):
    """Base inventory item schema with common attributes."""
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    quantity: int = Field(default=0, ge=0)
    buy_price: float = Field(default=0.0, ge=0.0)
    sell_price: float = Field(default=0.0, ge=0.0)
    category: Optional[str] = Field(None, max_length=50)
    min_stock_level: int = Field(default=0, ge=0)

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        """Validate that quantity cannot be negative."""
        if v < 0:
            raise ValueError('Stocks cannot be negative')
        return v

    @field_validator('sell_price')
    @classmethod
    def validate_sell_price(cls, v, info):
        """Validate that sell_price must be higher than buy_price."""
        # Get buy_price from the data being validated
        buy_price = info.data.get('buy_price')
        if buy_price is not None and v <= buy_price:
            raise ValueError('Sell price must be higher than buy price')
        return v


class InventoryItemCreate(InventoryItemBase):
    """Schema for inventory item creation."""
    warehouse_id: Optional[str] = None  # Optional on creation


class InventoryItemUpdate(BaseModel):
    """Schema for inventory item updates."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    quantity: Optional[int] = Field(None, ge=0)
    buy_price: Optional[float] = Field(None, ge=0.0)
    sell_price: Optional[float] = Field(None, ge=0.0)
    category: Optional[str] = Field(None, max_length=50)
    min_stock_level: Optional[int] = Field(None, ge=0)

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        """Validate that quantity cannot be negative."""
        if v is not None and v < 0:
            raise ValueError('Stocks cannot be negative')
        return v

    @field_validator('sell_price')
    @classmethod
    def validate_sell_price(cls, v, info):
        """Validate that sell_price must be higher than buy_price."""
        if v is not None:
            buy_price = info.data.get('buy_price')
            if buy_price is not None and v <= buy_price:
                raise ValueError('Sell price must be higher than buy price')
        return v


class InventoryItemResponse(BaseModel):
    """Schema for inventory item response."""
    id: str
    warehouse_id: str
    name: str
    sku: str
    description: Optional[str] = None
    quantity: int
    buy_price: float
    sell_price: float
    category: Optional[str] = None
    min_stock_level: int
    is_low_stock: bool
    total_value: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryStats(BaseModel):
    """Schema for inventory statistics."""
    total_items: int
    low_stock_items: int
    total_categories: int
    total_warehouses: int
    total_value: float

    class Config:
        from_attributes = True