from pydantic import BaseModel, EmailStr
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str  # Will be email, but OAuth2PasswordRequestForm uses 'username'
    password: str