"""
Migration script to add warehouse_id to existing activity metadata.
"""
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.domain.models.activity import Activity, ActivityType
from src.domain.models.inventory import InventoryItem
from src.domain.models.sell_transaction import SellTransaction
from src.domain.models.warehouse import Warehouse
import json


def migrate_activities():
    """Add warehouse_id to metadata for all existing activities."""
    db = next(get_db())

    try:
        print("Starting activity migration...")

        # Get all activities
        activities = db.query(Activity).all()
        print(f"Found {len(activities)} activities to migrate")

        updated_count = 0

        for activity in activities:
            warehouse_id = None

            # Parse existing metadata
            metadata = activity.meta_data or {}

            # Skip if warehouse_id already exists
            if "warehouse_id" in metadata:
                continue

            # Determine warehouse_id based on activity type and entity
            if activity.activity_type == ActivityType.WAREHOUSE_CREATED:
                # For warehouse creation, the entity_id is the warehouse_id
                warehouse_id = activity.entity_id

            elif activity.activity_type in [
                ActivityType.INVENTORY_CREATED,
                ActivityType.INVENTORY_UPDATED,
                ActivityType.INVENTORY_DELETED,
                ActivityType.INVENTORY_STOCK_ADJUSTED
            ]:
                # For inventory activities, get warehouse from inventory item
                if activity.entity_id:
                    item = db.query(InventoryItem).filter(InventoryItem.id == activity.entity_id).first()
                    if item:
                        warehouse_id = item.warehouse_id

            elif activity.activity_type == ActivityType.SELL_TRANSACTION:
                # For sell transactions, get warehouse from transaction
                if activity.entity_id:
                    transaction = db.query(SellTransaction).filter(SellTransaction.id == activity.entity_id).first()
                    if transaction:
                        warehouse_id = transaction.warehouse_id

            # Update metadata with warehouse_id if found
            if warehouse_id:
                # Get warehouse name if not already in metadata
                if "warehouse_name" not in metadata:
                    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
                    if warehouse:
                        metadata["warehouse_name"] = warehouse.name

                # Add warehouse_id to metadata
                metadata["warehouse_id"] = warehouse_id

                # Force SQLAlchemy to detect the change by using flag_modified
                from sqlalchemy.orm.attributes import flag_modified
                activity.meta_data = metadata
                flag_modified(activity, "meta_data")

                updated_count += 1
                print(f"  Updated activity {activity.id} ({activity.activity_type}) with warehouse_id: {warehouse_id}")

        # Commit changes
        db.commit()
        print(f"\nMigration completed successfully!")
        print(f"Updated {updated_count} out of {len(activities)} activities")

    except Exception as e:
        db.rollback()
        print(f"Error during migration: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_activities()
