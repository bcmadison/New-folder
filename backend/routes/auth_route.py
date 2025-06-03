from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime, timedelta, timezone
import os
import logging
from sqlalchemy import create_engine, Column, String, Boolean
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv

router = APIRouter()
logger = logging.getLogger("auth_route")
load_dotenv()

# --- Configuration for JWT and DB ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-for-jwt-shhh")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./users.db")

# --- SQLAlchemy Setup ---
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# OAuth2 scheme for FastAPI to recognize where to get the token from
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

# --- Password Hashing ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user_by_email(db: Session, email: str) -> Optional[UserDB]:
    return db.query(UserDB).filter(UserDB.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[UserDB]:
    return db.query(UserDB).filter(UserDB.username == username).first()

def get_user(db: Session, username_or_email: str) -> Optional[UserDB]:
    user = get_user_by_email(db, username_or_email)
    if not user:
        user = get_user_by_username(db, username_or_email)
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            logger.warning("JWT token 'sub' (username) is missing.")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT Error: {e}", exc_info=True)
        raise credentials_exception
    user = get_user(db, username)
    if user is None:
        logger.warning(f"User {username} from token not found in DB.")
        raise credentials_exception
    if user.disabled:
        logger.warning(f"User {username} is inactive.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/auth/register", response_model=UserResponse, summary="Register a new user")
async def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt for user: {request.email}")
    if get_user_by_email(db, request.email):
        raise HTTPException(status_code=400, detail="Email already registered.")
    if get_user_by_username(db, request.username):
        raise HTTPException(status_code=400, detail="Username already taken.")
    user = UserDB(
        id=os.urandom(8).hex(),
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        disabled=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"User registered: {user.username}")
    return UserResponse(id=user.id, username=user.username, email=user.email)

@router.post("/auth/token", response_model=Token, summary="Get JWT access token for OAuth2 form")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Attempting token generation for user: {form_data.username}")
    user = get_user(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"Token generated successfully for user: {user.username}")
    user_info_for_response = UserResponse(id=user.id, username=user.username, email=user.email).model_dump()
    return Token(access_token=access_token, token_type="bearer", user=user_info_for_response)

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/login", response_model=Token, summary="Login with email/password (preferred by frontend)")
async def login_endpoint(credentials: LoginRequest = Body(...), db: Session = Depends(get_db)):
    logger.info(f"Login attempt for user: {credentials.email}")
    user = get_user_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        logger.warning(f"Authentication failed for user: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"Login successful, token generated for user: {user.username}")
    user_info_for_response = UserResponse(id=user.id, username=user.username, email=user.email).model_dump()
    return Token(access_token=access_token, token_type="bearer", user=user_info_for_response)

@router.post("/auth/logout", summary="Logout user")
async def logout_endpoint():
    logger.info("Logout endpoint called. Client should clear token. No server-side session to invalidate.")
    return {"message": "Logout successful. Please clear your token on the client-side. No server-side session is maintained."}

@router.get("/users/me", response_model=UserResponse, summary="Get current authenticated user info")
async def read_users_me(current_user: UserDB = Depends(get_current_user)):
    logger.info(f"User {current_user.username} accessed /users/me")
    return UserResponse(id=current_user.id, username=current_user.username, email=current_user.email) 