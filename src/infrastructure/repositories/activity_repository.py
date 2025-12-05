from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.models.activity import Activity, ActivityType


class ActivityRepository:
    """Repository for managing activity data access."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, activity: Activity) -> Activity:
        """Create a new activity log entry."""
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def get_by_id(self, activity_id: str) -> Optional[Activity]:
        """Get an activity by ID."""
        return self.db.query(Activity).filter(Activity.id == activity_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities with pagination, ordered by most recent."""
        return self.db.query(Activity).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities for a specific user."""
        return self.db.query(Activity).filter(
            Activity.user_id == user_id
        ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_entity(self, entity_type: str, entity_id: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities for a specific entity."""
        return self.db.query(Activity).filter(
            Activity.entity_type == entity_type,
            Activity.entity_id == entity_id
        ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_activity_type(self, activity_type: ActivityType, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities of a specific type."""
        return self.db.query(Activity).filter(
            Activity.activity_type == activity_type
        ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_entity_type(self, entity_type: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities for a specific entity type."""
        return self.db.query(Activity).filter(
            Activity.entity_type == entity_type
        ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_warehouse_id(self, warehouse_id: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get all activities for a specific warehouse by filtering metadata."""
        return self.db.query(Activity).filter(
            Activity.meta_data['warehouse_id'].as_string() == warehouse_id
        ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
