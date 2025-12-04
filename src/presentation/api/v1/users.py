from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.application.services.user_service import UserService
from src.presentation.schemas.user import UserResponse, UserUpdate
from src.core.dependencies import get_current_user
from src.domain.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user from token

    Returns:
        Current user data
    """
    return current_user


@router.get("", response_model=List[UserResponse])
def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users (protected route, requires authentication).

    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of users
    """
    service = UserService(db)
    return service.get_all_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID (protected route, requires authentication).

    Args:
        user_id: ID of user to retrieve
        db: Database session
        current_user: Current authenticated user

    Returns:
        User data
    """
    service = UserService(db)
    return service.get_user_by_id(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user information (protected route, requires authentication).

    Args:
        user_id: ID of user to update
        user_data: Updated user data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated user data
    """
    service = UserService(db)
    return service.update_user(user_id, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete user (protected route, requires authentication).

    Args:
        user_id: ID of user to delete
        db: Database session
        current_user: Current authenticated user

    Returns:
        204 No Content
    """
    service = UserService(db)
    service.delete_user(user_id)
    return None
