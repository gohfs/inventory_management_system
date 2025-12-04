from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WarehouseBase(BaseModel):
    """Base warehouse schema with common attributes."""
    name: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)


class WarehouseCreate(WarehouseBase):
    """Schema for warehouse creation."""
    pass


class WarehouseUpdate(BaseModel):
    """Schema for warehouse updates."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)


class WarehouseResponse(WarehouseBase):
    """Schema for warehouse response."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
