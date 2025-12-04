from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.application.services.user_service import UserService
from src.presentation.schemas.user import UserCreate, UserLogin, AuthResponse, AuthUser, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user_data: User registration data (email, name, password)
        db: Database session

    Returns:
        Authentication response with user data and token
    """
    service = UserService(db)
    user = service.register(user_data)

    # Authenticate immediately after registration
    credentials = UserLogin(email=user_data.email, password=user_data.password)
    auth_user = service.authenticate(credentials)

    return AuthResponse(success=True, data=auth_user)


@router.post("/login", response_model=AuthResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.

    Args:
        credentials: User login credentials (email, password)
        db: Database session

    Returns:
        Authentication response with user data and JWT token
    """
    service = UserService(db)
    auth_user = service.authenticate(credentials)

    return AuthResponse(success=True, data=auth_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """
    Logout endpoint (stateless, token invalidation handled client-side).

    Returns:
        204 No Content
    """
    # Since we're using stateless JWT, logout is handled client-side
    # by removing the token from storage
    return None
