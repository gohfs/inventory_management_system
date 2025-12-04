from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from src.domain.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for user creation (registration)."""
    password: str = Field(..., min_length=6, max_length=16)


class UserUpdate(BaseModel):
    """Schema for user updates."""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=16)


class UserResponse(UserBase):
    """Schema for user response (without password)."""
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: Optional[str] = None


class AuthUser(BaseModel):
    """Schema for authenticated user with token."""
    id: str
    email: str
    name: str
    role: UserRole
    token: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Schema for authentication response with user data and token."""
    success: bool
    data: Optional[AuthUser] = None
    error: Optional[str] = None
