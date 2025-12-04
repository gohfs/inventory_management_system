from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.application.services.activity_service import ActivityService
from src.presentation.schemas.activity import ActivityResponse, ActivityListResponse
from src.core.dependencies import get_current_user
from src.domain.models.user import User
from src.domain.models.activity import ActivityType

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=ActivityListResponse)
def get_all_activities(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (inventory, warehouse, sell_transaction, user)"),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all activities with pagination and optional filtering (Protected route).

    This endpoint returns activity logs that track all operations in the system:
    - Inventory operations (create, update, delete, stock adjustments)
    - Warehouse operations (create, update, delete)
    - Sell transactions
    - User operations (login, create, update, delete)

    Activities are ordered by most recent first.

    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (max 500)
        entity_type: Optional filter by entity type
        activity_type: Optional filter by activity type
        user_id: Optional filter by user ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of activities with total count
    """
    service = ActivityService(db)

    # Apply filters based on query parameters
    if user_id:
        activities = service.get_activities_by_user(user_id=user_id, skip=skip, limit=limit)
    elif entity_type:
        activities = service.get_activities_by_entity_type(entity_type=entity_type, skip=skip, limit=limit)
    elif activity_type:
        activities = service.get_activities_by_type(activity_type=activity_type, skip=skip, limit=limit)
    else:
        activities = service.get_all_activities(skip=skip, limit=limit)

    return ActivityListResponse(
        success=True,
        data=activities,
        total=len(activities),
        error=None
    )


@router.get("/entity/{entity_type}/{entity_id}", response_model=ActivityListResponse)
def get_activities_by_entity(
    entity_type: str,
    entity_id: str,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all activities for a specific entity (Protected route).

    This allows you to see the complete history of operations for a specific:
    - Inventory item
    - Warehouse
    - Sell transaction
    - User

    Args:
        entity_type: Type of entity (inventory, warehouse, sell_transaction, user)
        entity_id: ID of the entity
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (max 500)
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of activities for the specified entity with total count
    """
    service = ActivityService(db)
    activities = service.get_activities_by_entity(
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit
    )

    return ActivityListResponse(
        success=True,
        data=activities,
        total=len(activities),
        error=None
    )
