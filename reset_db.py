"""
Script to reset the database by dropping all tables and recreating them.
"""
from src.infrastructure.database.database import Base, engine
from src.domain.models import User, Warehouse, InventoryItem, SellTransaction, Activity
from sqlalchemy import text

def reset_database():
    """Drop all tables and recreate them."""
    print("Dropping all tables with CASCADE...")

    # Use raw SQL with CASCADE to drop tables in correct order
    with engine.begin() as conn:
        # Drop tables in reverse order of dependencies
        conn.execute(text("DROP TABLE IF EXISTS activities CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS sell_transactions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS inventory_items CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS warehouses CASCADE"))

    print("All tables dropped successfully!")

    print("\nCreating all tables...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully!")

    print("\nDatabase reset complete!")
    print("Start the application to seed initial data.")

if __name__ == "__main__":
    reset_database()
