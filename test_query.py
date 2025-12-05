"""
Test script to debug the warehouse_id query.
"""
from src.infrastructure.database.database import get_db
from src.domain.models.activity import Activity
from sqlalchemy import cast, String

def test_query():
    """Test different query methods for warehouse_id."""
    db = next(get_db())

    # Test warehouse ID from the verification
    warehouse_id = "1ad81e07-0c6d-442c-86f4-81659c592e1e"

    print(f"Testing queries for warehouse_id: {warehouse_id}\n")

    # Method 1: Using cast
    print("Method 1: Using cast(Activity.meta_data['warehouse_id'], String)")
    try:
        activities = db.query(Activity).filter(
            cast(Activity.meta_data['warehouse_id'], String) == warehouse_id
        ).all()
        print(f"  Found {len(activities)} activities")
        for act in activities[:3]:
            print(f"    - {act.id}: {act.activity_type}")
    except Exception as e:
        print(f"  Error: {e}")

    # Method 2: Using direct JSON comparison
    print("\nMethod 2: Using Activity.meta_data['warehouse_id'].as_string()")
    try:
        activities = db.query(Activity).filter(
            Activity.meta_data['warehouse_id'].as_string() == warehouse_id
        ).all()
        print(f"  Found {len(activities)} activities")
        for act in activities[:3]:
            print(f"    - {act.id}: {act.activity_type}")
    except Exception as e:
        print(f"  Error: {e}")

    # Method 3: Check all activities with warehouse_id
    print("\nMethod 3: Get all activities and filter in Python")
    all_activities = db.query(Activity).all()
    matched = [a for a in all_activities if a.meta_data and a.meta_data.get('warehouse_id') == warehouse_id]
    print(f"  Found {len(matched)} activities out of {len(all_activities)} total")
    for act in matched[:3]:
        print(f"    - {act.id}: {act.activity_type}, metadata: {act.meta_data}")

    db.close()

if __name__ == "__main__":
    test_query()
