from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from src.domain.models.activity import ActivityType


class ActivityResponse(BaseModel):
    """Schema for activity response."""
    id: str
    user_id: Optional[str]
    activity_type: ActivityType
    entity_type: str
    entity_id: Optional[str]
    description: str
    meta_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    """Schema for listing activities."""
    success: bool = True
    data: list[ActivityResponse]
    total: int
    error: Optional[str] = None
