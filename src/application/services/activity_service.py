from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from src.domain.models.activity import Activity, ActivityType
from src.infrastructure.repositories.activity_repository import ActivityRepository


class ActivityService:
    """Service for managing activity tracking operations."""

    def __init__(self, db: Session):
        self.db = db
        self.activity_repository = ActivityRepository(db)

    def log_activity(
        self,
        user_id: Optional[str],
        activity_type: ActivityType,
        entity_type: str,
        entity_id: Optional[str],
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Activity:
        """
        Log a new activity.

        Args:
            user_id: ID of the user performing the action (None for system actions)
            activity_type: Type of activity
            entity_type: Type of entity affected (inventory, warehouse, sell_transaction, user)
            entity_id: ID of the affected entity
            description: Human-readable description of the activity
            metadata: Additional context data

        Returns:
            Created activity instance
        """
        activity = Activity(
            user_id=user_id,
            activity_type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            meta_data=metadata
        )
        return self.activity_repository.create(activity)

    def get_all_activities(self, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities with pagination."""
        return self.activity_repository.get_all(skip=skip, limit=limit)

    def get_activities_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities for a specific user."""
        return self.activity_repository.get_by_user_id(user_id=user_id, skip=skip, limit=limit)

    def get_activities_by_entity(
        self,
        entity_type: str,
        entity_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Activity]:
        """Get all activities for a specific entity."""
        return self.activity_repository.get_by_entity(
            entity_type=entity_type,
            entity_id=entity_id,
            skip=skip,
            limit=limit
        )

    def get_activities_by_type(
        self,
        activity_type: ActivityType,
        skip: int = 0,
        limit: int = 100
    ) -> List[Activity]:
        """Get all activities of a specific type."""
        return self.activity_repository.get_by_activity_type(
            activity_type=activity_type,
            skip=skip,
            limit=limit
        )

    def get_activities_by_entity_type(
        self,
        entity_type: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Activity]:
        """Get all activities for a specific entity type."""
        return self.activity_repository.get_by_entity_type(
            entity_type=entity_type,
            skip=skip,
            limit=limit
        )
