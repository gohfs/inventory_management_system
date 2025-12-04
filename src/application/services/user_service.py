from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.domain.models.user import User, UserRole
from src.infrastructure.repositories.user_repository import UserRepository
from src.presentation.schemas.user import UserCreate, UserUpdate, UserLogin, AuthUser
from src.core.security import verify_password, create_access_token


class UserService:
    """Service layer for user business logic."""

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def register(self, user_data: UserCreate, role: UserRole = UserRole.WAREHOUSE) -> User:
        """
        Register a new user without warehouse assignment.
        Users will select/create a warehouse after login.

        Args:
            user_data: User registration data
            role: User role (defaults to WAREHOUSE)

        Returns:
            Created user instance

        Raises:
            HTTPException: If email already exists
        """
        if self.repository.exists_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        return self.repository.create(user_data, role=role)

    def authenticate(self, credentials: UserLogin) -> AuthUser:
        """
        Authenticate user and return user data with token.

        Args:
            credentials: User login credentials

        Returns:
            Authenticated user with JWT token

        Raises:
            HTTPException: If credentials are invalid
        """
        user = self.repository.get_by_email(credentials.email)

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        # Create access token
        access_token = create_access_token(data={"sub": user.id})

        return AuthUser(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            token=access_token
        )

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return self.repository.get_all(skip=skip, limit=limit)

    def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        """
        Update user information.

        Args:
            user_id: ID of user to update
            user_data: Updated user data

        Returns:
            Updated user instance

        Raises:
            HTTPException: If user not found or email already taken
        """
        # Check if email is being changed and already exists
        if user_data.email:
            existing_user = self.repository.get_by_email(user_data.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken"
                )

        user = self.repository.update(user_id, user_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    def delete_user(self, user_id: str) -> bool:
        """
        Delete a user.

        Args:
            user_id: ID of user to delete

        Returns:
            True if deleted

        Raises:
            HTTPException: If user not found
        """
        if not self.repository.delete(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return True
