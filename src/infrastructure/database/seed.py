"""
Database seeding script for initial super admin user.
"""
from sqlalchemy.orm import Session
from src.domain.models.user import User, UserRole
from src.core.security import get_password_hash
import uuid


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


def seed_database(db: Session) -> None:
    """
    Run all database seeding operations.

    Args:
        db: Database session
    """
    print("Starting database seeding...")
    seed_super_admin(db)
    print("Database seeding completed.")
