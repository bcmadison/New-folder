from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse
from core.security import create_access_token, get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/register", response_model=UserResponse)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass

@router.post("/token")
async def login(
    username: str,
    password: str,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass
