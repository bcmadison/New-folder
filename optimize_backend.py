import os
import shutil
from pathlib import Path
import re

def optimize_server_structure():
    """Optimize the server.py structure and move components to appropriate modules."""
    server_path = Path('backend/server.py')
    if not server_path.exists():
        return
    
    # Create necessary directories
    os.makedirs('backend/api/v1', exist_ok=True)
    os.makedirs('backend/core', exist_ok=True)
    os.makedirs('backend/middleware', exist_ok=True)
    
    # Read server.py content
    with open(server_path, 'r') as f:
        content = f.read()
    
    # Extract and create middleware
    middleware_content = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import socket

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def setup_cors(app: FastAPI):
    local_ip = get_local_ip()
    allowed_origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://127.0.0.1",
        f"http://{local_ip}",
        f"http://{local_ip}:3000",
        f"http://{local_ip}:5173",  # Vite dev server
    ]
    
    additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "").split(",")
    allowed_origins.extend([origin for origin in additional_origins if origin])
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
"""
    
    with open('backend/middleware/cors.py', 'w') as f:
        f.write(middleware_content)
    
    # Create config module
    config_content = """from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    API_BASE_URL: str = "http://localhost:8000"
    DATABASE_URL: str = "sqlite:///./test.db"
    JWT_SECRET: str = "your-secret-key"
    ROOT_EMAIL: str = "root@localhost"
    ROOT_USERNAME: str = "root"
    ROOT_PASSWORD: str = "admin123"
    
    class Config:
        env_file = ".env"

settings = Settings()
"""
    
    with open('backend/core/config.py', 'w') as f:
        f.write(config_content)
    
    # Create database module
    db_content = """from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""
    
    with open('backend/core/database.py', 'w') as f:
        f.write(db_content)
    
    # Create optimized server.py
    optimized_server = """from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uvicorn
import os

from core.config import settings
from core.database import Base, engine
from middleware.cors import setup_cors
from api.v1.endpoints import prediction, auth, analytics, settings as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="AI Sports Betting Analytics API",
    description="Backend API for the AI Sports Betting Analytics Platform.",
    version="0.1.0",
    lifespan=lifespan
)

# Setup CORS
setup_cors(app)

# Include routers
app.include_router(prediction.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Server is running",
        "api_url": settings.API_BASE_URL
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
"""
    
    with open('backend/server.py', 'w') as f:
        f.write(optimized_server)

def create_api_structure():
    """Create the API structure with endpoints."""
    # Create prediction endpoints
    prediction_content = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.prediction import Prediction
from schemas.prediction import PredictionCreate, PredictionResponse

router = APIRouter()

@router.post("/", response_model=PredictionResponse)
async def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass

@router.get("/", response_model=List[PredictionResponse])
async def get_predictions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Implementation here
    pass
"""
    
    os.makedirs('backend/api/v1/endpoints', exist_ok=True)
    with open('backend/api/v1/endpoints/prediction.py', 'w') as f:
        f.write(prediction_content)
    
    # Create auth endpoints
    auth_content = """from fastapi import APIRouter, Depends, HTTPException
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
"""
    
    with open('backend/api/v1/endpoints/auth.py', 'w') as f:
        f.write(auth_content)

def create_models():
    """Create database models."""
    models_content = """from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    predictions = relationship("Prediction", back_populates="user")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    sport = Column(String)
    prediction = Column(String)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="predictions")
"""
    
    os.makedirs('backend/models', exist_ok=True)
    with open('backend/models/models.py', 'w') as f:
        f.write(models_content)

def create_schemas():
    """Create Pydantic schemas."""
    schemas_content = """from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    disabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionBase(BaseModel):
    sport: str
    prediction: str
    confidence: float

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
"""
    
    os.makedirs('backend/schemas', exist_ok=True)
    with open('backend/schemas/schemas.py', 'w') as f:
        f.write(schemas_content)

def main():
    """Main function to run all backend optimization steps."""
    print("Starting backend optimization...")
    
    # Optimize server structure
    optimize_server_structure()
    print("✓ Optimized server structure")
    
    # Create API structure
    create_api_structure()
    print("✓ Created API structure")
    
    # Create models
    create_models()
    print("✓ Created database models")
    
    # Create schemas
    create_schemas()
    print("✓ Created Pydantic schemas")
    
    print("\nBackend optimization complete!")

if __name__ == "__main__":
    main() 