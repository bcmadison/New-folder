from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session

from core.auth import (
    create_access_token, authenticate_user, create_user,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)
from core.database import get_db
from models.database import User

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        user = create_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            name=user_data.username
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )
        
        return TokenResponse(
            token=access_token,
            user=UserResponse.from_orm(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.get("/validate", response_model=UserResponse)
async def validate_token(current_user: User = Depends(get_current_user)):
    """Validate token and return user information."""
    return UserResponse.from_orm(current_user)

@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    updates: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile."""
    # Update user data
    for key, value in updates.items():
        if hasattr(current_user, key) and key not in ["id", "email", "role"]:
            setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user) 