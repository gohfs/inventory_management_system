"""
Database seeding script for initial data.
"""
from sqlalchemy.orm import Session
from src.domain.models.user import User, UserRole
from src.domain.models.warehouse import Warehouse
from src.domain.models.inventory import InventoryItem
from src.domain.models.sell_transaction import SellTransaction
from src.domain.models.activity import Activity, ActivityType
from src.core.security import get_password_hash
import uuid
from datetime import datetime, timedelta
import random


def seed_super_admin(db: Session) -> None:
    """
    Create the initial super admin user if it doesn't exist.

    Args:
        db: Database session
    """
    # Check if super admin already exists
    super_admin_email = "admin@satek.com"
    existing_admin = db.query(User).filter(
        User.email == super_admin_email,
        User.role == UserRole.SUPER_ADMIN
    ).first()

    if existing_admin:
        print(f"Super admin user already exists: {super_admin_email}")
        return

    # Create super admin user
    super_admin = User(
        id=str(uuid.uuid4()),
        email=super_admin_email,
        name="Super Admin",
        hashed_password=get_password_hash("admin1234"),  # Default password
        role=UserRole.SUPER_ADMIN,
        # Super admin is not assigned to any warehouse
        is_active=True
    )

    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)

    print(f"Super admin user created successfully!")
    print(f"Email: {super_admin_email}")
    print(f"Password: admin1234")
    print("Please change the password after first login.")


def seed_warehouses(db: Session) -> list[Warehouse]:
    """
    Create 10 warehouse entries if they don't exist.

    Args:
        db: Database session

    Returns:
        List of warehouse instances
    """
    warehouse_data = [
        {"name": "Main Warehouse Jakarta", "location": "Jakarta, Indonesia", "description": "Primary warehouse for Jakarta region"},
        {"name": "Warehouse Surabaya", "location": "Surabaya, Indonesia", "description": "Eastern Java distribution center"},
        {"name": "Warehouse Bandung", "location": "Bandung, Indonesia", "description": "West Java regional warehouse"},
        {"name": "Warehouse Medan", "location": "Medan, Indonesia", "description": "Sumatra distribution hub"},
        {"name": "Warehouse Makassar", "location": "Makassar, Indonesia", "description": "Eastern Indonesia logistics center"},
        {"name": "Warehouse Semarang", "location": "Semarang, Indonesia", "description": "Central Java warehouse facility"},
        {"name": "Warehouse Denpasar", "location": "Denpasar, Bali", "description": "Bali and Nusa Tenggara warehouse"},
        {"name": "Warehouse Palembang", "location": "Palembang, Indonesia", "description": "South Sumatra distribution center"},
        {"name": "Warehouse Balikpapan", "location": "Balikpapan, Indonesia", "description": "Kalimantan regional warehouse"},
        {"name": "Warehouse Yogyakarta", "location": "Yogyakarta, Indonesia", "description": "Special region warehouse facility"}
    ]

    warehouses = []
    for data in warehouse_data:
        existing = db.query(Warehouse).filter(Warehouse.name == data["name"]).first()
        if not existing:
            warehouse = Warehouse(
                id=str(uuid.uuid4()),
                name=data["name"],
                location=data["location"],
                description=data["description"]
            )
            db.add(warehouse)
            warehouses.append(warehouse)
            print(f"Created warehouse: {data['name']}")
        else:
            warehouses.append(existing)
            print(f"Warehouse already exists: {data['name']}")

    db.commit()
    return warehouses


def seed_inventory_items(db: Session, warehouses: list[Warehouse]) -> list[InventoryItem]:
    """
    Create 10 inventory items for each warehouse (100 items total).

    Args:
        db: Database session
        warehouses: List of warehouse instances

    Returns:
        List of inventory item instances
    """
    # Base inventory data - will be created for each warehouse
    inventory_templates = [
        {"name": "Laptop Dell XPS 15", "sku_prefix": "LAP-DELL-XPS15", "description": "15-inch high-performance laptop",
         "quantity": 50, "buy_price": 15000000, "sell_price": 18000000, "category": "Electronics", "min_stock_level": 10},
        {"name": "Office Chair Ergonomic", "sku_prefix": "CHR-ERG-001", "description": "Comfortable ergonomic office chair",
         "quantity": 120, "buy_price": 1500000, "sell_price": 2000000, "category": "Furniture", "min_stock_level": 20},
        {"name": "Wireless Mouse Logitech", "sku_prefix": "MSE-LOG-WRL", "description": "Wireless optical mouse",
         "quantity": 3, "buy_price": 250000, "sell_price": 350000, "category": "Electronics", "min_stock_level": 50},  # LOW STOCK
        {"name": "Monitor LG 27 inch", "sku_prefix": "MON-LG-27", "description": "27-inch Full HD monitor",
         "quantity": 75, "buy_price": 3000000, "sell_price": 4000000, "category": "Electronics", "min_stock_level": 15},
        {"name": "Standing Desk", "sku_prefix": "DSK-STD-001", "description": "Adjustable height standing desk",
         "quantity": 40, "buy_price": 3500000, "sell_price": 5000000, "category": "Furniture", "min_stock_level": 10},
        {"name": "Mechanical Keyboard", "sku_prefix": "KBD-MCH-RGB", "description": "RGB mechanical gaming keyboard",
         "quantity": 90, "buy_price": 1200000, "sell_price": 1800000, "category": "Electronics", "min_stock_level": 25},
        {"name": "Printer HP LaserJet", "sku_prefix": "PRT-HP-LJ", "description": "Black and white laser printer",
         "quantity": 2, "buy_price": 4000000, "sell_price": 5500000, "category": "Electronics", "min_stock_level": 50},  # LOW STOCK
        {"name": "Filing Cabinet 4-Drawer", "sku_prefix": "CAB-FIL-4D", "description": "Metal filing cabinet with 4 drawers",
         "quantity": 60, "buy_price": 2000000, "sell_price": 2800000, "category": "Furniture", "min_stock_level": 15},
        {"name": "Webcam HD 1080p", "sku_prefix": "WBC-HD-1080", "description": "Full HD webcam with microphone",
         "quantity": 100, "buy_price": 800000, "sell_price": 1200000, "category": "Electronics", "min_stock_level": 30},
        {"name": "Desk Lamp LED", "sku_prefix": "LMP-DSK-LED", "description": "Adjustable LED desk lamp",
         "quantity": 150, "buy_price": 300000, "sell_price": 500000, "category": "Office Supplies", "min_stock_level": 40}
    ]

    inventory_items = []

    # Create 10 items for each warehouse
    for idx, warehouse in enumerate(warehouses):
        print(f"\n  Creating inventory for {warehouse.name}:")
        for template in inventory_templates:
            # Generate unique SKU by adding warehouse index (W01, W02, etc.)
            warehouse_code = f"W{idx+1:02d}"  # W01, W02, W03, etc.
            sku = f"{template['sku_prefix']}-{warehouse_code}"

            # Check if item already exists
            existing = db.query(InventoryItem).filter(InventoryItem.sku == sku).first()
            if not existing:
                # Add some variation to quantities for realism
                quantity_variation = random.randint(-20, 30)
                adjusted_quantity = max(0, template["quantity"] + quantity_variation)

                item = InventoryItem(
                    id=str(uuid.uuid4()),
                    warehouse_id=warehouse.id,
                    name=template["name"],
                    sku=sku,
                    description=template["description"],
                    quantity=adjusted_quantity,
                    buy_price=template["buy_price"],
                    sell_price=template["sell_price"],
                    category=template["category"],
                    min_stock_level=template["min_stock_level"]
                )
                db.add(item)
                inventory_items.append(item)
                print(f"    - Created: {template['name']} (SKU: {sku}, Qty: {adjusted_quantity})")
            else:
                inventory_items.append(existing)
                print(f"    - Already exists: {template['name']} (SKU: {sku})")

    db.commit()
    print(f"\n  Total inventory items created/found: {len(inventory_items)}")
    return inventory_items


def seed_sell_transactions(db: Session, warehouses: list[Warehouse], inventory_items: list[InventoryItem], super_admin: User) -> list[SellTransaction]:
    """
    Create sample sell transactions.

    Args:
        db: Database session
        warehouses: List of warehouse instances
        inventory_items: List of inventory item instances
        super_admin: Super admin user instance

    Returns:
        List of sell transaction instances
    """
    # Check if transactions already exist
    existing_count = db.query(SellTransaction).count()
    if existing_count > 0:
        print(f"Sell transactions already exist ({existing_count} records)")
        return db.query(SellTransaction).all()

    transactions = []
    # Create 15 transactions
    for i in range(15):
        # Pick random inventory item with available stock
        item = random.choice(inventory_items)

        # Skip if not enough quantity
        if item.quantity < 1:
            continue

        # Random quantity between 1 and min(10, available quantity)
        max_quantity = min(10, item.quantity)
        quantity = random.randint(1, max_quantity)

        transaction = SellTransaction(
            id=str(uuid.uuid4()),
            warehouse_id=item.warehouse_id,
            inventory_item_id=item.id,
            user_id=super_admin.id,
            quantity=quantity,
            unit_price=item.sell_price,
            total_price=item.sell_price * quantity,
            description=f"Sample sale transaction #{i+1}"
        )

        db.add(transaction)
        transactions.append(transaction)
        print(f"Created sell transaction: {quantity}x {item.name}")

    db.commit()
    return transactions


def seed_activities(db: Session, super_admin: User, warehouses: list[Warehouse], inventory_items: list[InventoryItem], transactions: list[SellTransaction]) -> None:
    """
    Create sample activity logs.

    Args:
        db: Database session
        super_admin: Super admin user instance
        warehouses: List of warehouse instances
        inventory_items: List of inventory item instances
        transactions: List of sell transaction instances
    """
    # Check if activities already exist
    existing_count = db.query(Activity).count()
    if existing_count > 0:
        print(f"Activities already exist ({existing_count} records)")
        return

    activities = []

    # Activity for super admin login
    activities.append(Activity(
        id=str(uuid.uuid4()),
        user_id=super_admin.id,
        activity_type=ActivityType.USER_LOGIN,
        entity_type="user",
        entity_id=super_admin.id,
        description=f"Super Admin logged in",
        meta_data={"email": super_admin.email}
    ))

    # Activities for warehouse creation
    for warehouse in warehouses[:5]:  # First 5 warehouses
        activities.append(Activity(
            id=str(uuid.uuid4()),
            user_id=super_admin.id,
            activity_type=ActivityType.WAREHOUSE_CREATED,
            entity_type="warehouse",
            entity_id=warehouse.id,
            description=f"Created warehouse: {warehouse.name}",
            meta_data={"warehouse_name": warehouse.name, "location": warehouse.location}
        ))

    # Activities for inventory creation
    for item in inventory_items[:5]:  # First 5 items
        warehouse = next((w for w in warehouses if w.id == item.warehouse_id), None)
        activities.append(Activity(
            id=str(uuid.uuid4()),
            user_id=super_admin.id,
            activity_type=ActivityType.INVENTORY_CREATED,
            entity_type="inventory",
            entity_id=item.id,
            description=f"Created inventory item: {item.name}",
            meta_data={
                "item_name": item.name,
                "sku": item.sku,
                "warehouse_name": warehouse.name if warehouse else "Unknown",
                "initial_quantity": item.quantity
            }
        ))

    # Activities for sell transactions
    for transaction in transactions[:10]:  # First 10 transactions
        item = next((i for i in inventory_items if i.id == transaction.inventory_item_id), None)
        warehouse = next((w for w in warehouses if w.id == transaction.warehouse_id), None)

        if item and warehouse:
            activities.append(Activity(
                id=str(uuid.uuid4()),
                user_id=super_admin.id,
                activity_type=ActivityType.SELL_TRANSACTION,
                entity_type="sell_transaction",
                entity_id=transaction.id,
                description=f"Sold {transaction.quantity} units of {item.name} from {warehouse.name}",
                meta_data={
                    "warehouse_name": warehouse.name,
                    "item_name": item.name,
                    "quantity": transaction.quantity,
                    "unit_price": transaction.unit_price,
                    "total_price": transaction.total_price
                }
            ))

    # Activities for inventory stock adjustments (related to transactions)
    for transaction in transactions[:8]:  # First 8 transactions
        item = next((i for i in inventory_items if i.id == transaction.inventory_item_id), None)
        warehouse = next((w for w in warehouses if w.id == transaction.warehouse_id), None)

        if item and warehouse:
            activities.append(Activity(
                id=str(uuid.uuid4()),
                user_id=super_admin.id,
                activity_type=ActivityType.INVENTORY_STOCK_ADJUSTED,
                entity_type="inventory",
                entity_id=item.id,
                description=f"Stock reduced by {transaction.quantity} units due to sale",
                meta_data={
                    "warehouse_name": warehouse.name,
                    "item_name": item.name,
                    "quantity_change": -transaction.quantity,
                    "transaction_id": transaction.id
                }
            ))

    # Add some inventory update activities
    for item in inventory_items[5:8]:  # Items 6-8
        activities.append(Activity(
            id=str(uuid.uuid4()),
            user_id=super_admin.id,
            activity_type=ActivityType.INVENTORY_UPDATED,
            entity_type="inventory",
            entity_id=item.id,
            description=f"Updated inventory item: {item.name}",
            meta_data={
                "item_name": item.name,
                "sku": item.sku,
                "changes": "Price adjustment"
            }
        ))

    # Bulk insert activities
    db.bulk_save_objects(activities)
    db.commit()
    print(f"Created {len(activities)} activity logs")


def seed_database(db: Session) -> None:
    """
    Run all database seeding operations.

    Args:
        db: Database session
    """
    print("Starting database seeding...")

    # Seed super admin first
    seed_super_admin(db)

    # Get super admin for foreign key references
    super_admin = db.query(User).filter(
        User.email == "admin@satek.com",
        User.role == UserRole.SUPER_ADMIN
    ).first()

    if not super_admin:
        print("Error: Super admin not found. Cannot continue seeding.")
        return

    # Seed warehouses
    print("\n--- Seeding Warehouses ---")
    warehouses = seed_warehouses(db)

    # Seed inventory items
    print("\n--- Seeding Inventory Items ---")
    inventory_items = seed_inventory_items(db, warehouses)

    # Seed sell transactions
    print("\n--- Seeding Sell Transactions ---")
    transactions = seed_sell_transactions(db, warehouses, inventory_items, super_admin)

    # Seed activities
    print("\n--- Seeding Activities ---")
    seed_activities(db, super_admin, warehouses, inventory_items, transactions)

    print("\n=== Database seeding completed successfully! ===")
