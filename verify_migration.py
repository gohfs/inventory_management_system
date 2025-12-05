"""
Verification script to check if warehouse_id exists in activity metadata.
"""
from src.infrastructure.database.database import get_db
from src.domain.models.activity import Activity

def verify_migration():
    """Check if warehouse_id was added to activity metadata."""
    db = next(get_db())

    try:
        # Get a few sample activities
        activities = db.query(Activity).limit(5).all()

        print(f"Checking {len(activities)} sample activities:\n")

        for activity in activities:
            metadata = activity.meta_data or {}
            has_warehouse_id = "warehouse_id" in metadata
            warehouse_id = metadata.get("warehouse_id", "N/A")

            print(f"Activity ID: {activity.id}")
            print(f"  Type: {activity.activity_type}")
            print(f"  Has warehouse_id: {has_warehouse_id}")
            print(f"  Warehouse ID: {warehouse_id}")
            print(f"  Metadata: {metadata}")
            print()

    finally:
        db.close()


if __name__ == "__main__":
    verify_migration()
