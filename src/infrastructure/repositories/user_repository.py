from typing import Optional, List
from sqlalchemy.orm import Session
from src.domain.models.user import User, UserRole
from src.presentation.schemas.user import UserCreate, UserUpdate
from src.core.security import get_password_hash


class UserRepository:
    """Repository for User data access operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return self.db.query(User).offset(skip).limit(limit).all()

    def create(self, user_data: UserCreate, role: UserRole = UserRole.WAREHOUSE) -> User:
        """
        Create a new user.

        Args:
            user_data: User creation data with plain password
            role: User role (defaults to WAREHOUSE)

        Returns:
            Created user instance
        """
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            role=role
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """
        Update an existing user.

        Args:
            user_id: ID of user to update
            user_data: Updated user data

        Returns:
            Updated user instance or None if not found
        """
        db_user = self.get_by_id(user_id)
        if not db_user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        # Hash password if it's being updated
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

        for field, value in update_data.items():
            setattr(db_user, field, value)

        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def delete(self, user_id: str) -> bool:
        """
        Delete a user.

        Args:
            user_id: ID of user to delete

        Returns:
            True if deleted, False if not found
        """
        db_user = self.get_by_id(user_id)
        if not db_user:
            return False

        self.db.delete(db_user)
        self.db.commit()
        return True

    def exists_by_email(self, email: str) -> bool:
        """Check if a user with given email exists."""
        return self.db.query(User).filter(User.email == email).first() is not None
