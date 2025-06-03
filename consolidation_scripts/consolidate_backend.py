#!/usr/bin/env python3
"""
Backend Consolidation Script
Consolidates and optimizes the backend code structure
"""

import os
import shutil
import json
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/backend_consolidation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

class BackendConsolidator:
    def __init__(self):
        self.root_dir = Path.cwd().parent  # Go up one level to the main project directory
        self.final_app_dir = self.root_dir / 'finalApp'
        self.backend_dir = self.final_app_dir / 'backend'

    def consolidate(self):
        """Main consolidation process"""
        logging.info("Starting backend consolidation...")
        
        # Create necessary directories
        self._create_directories()
        
        # Consolidate models
        self._consolidate_models()
        
        # Consolidate schemas
        self._consolidate_schemas()
        
        # Consolidate routers
        self._consolidate_routers()
        
        # Consolidate services
        self._consolidate_services()
        
        # Consolidate utils
        self._consolidate_utils()
        
        # Create requirements.txt
        self._create_requirements()
        
        # Create main.py
        self._create_main()
        
        # Create config.py
        self._create_config()
        
        logging.info("Backend consolidation complete!")

    def _create_directories(self):
        """Create necessary directory structure"""
        directories = [
            'app/models',
            'app/schemas',
            'app/routers',
            'app/services',
            'app/utils',
            'app/core',
            'app/api',
            'tests'
        ]
        
        for dir_path in directories:
            (self.backend_dir / dir_path).mkdir(parents=True, exist_ok=True)
            logging.info(f"Created directory: {dir_path}")

    def _consolidate_models(self):
        """Consolidate database models"""
        model_files = {
            'user.py': self._merge_user_model(),
            'prediction.py': self._merge_prediction_model(),
            'lineup.py': self._merge_lineup_model()
        }
        
        for filename, content in model_files.items():
            with open(self.backend_dir / 'app' / 'models' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_schemas(self):
        """Consolidate Pydantic schemas"""
        schema_files = {
            'user.py': self._merge_user_schema(),
            'prediction.py': self._merge_prediction_schema(),
            'lineup.py': self._merge_lineup_schema()
        }
        
        for filename, content in schema_files.items():
            with open(self.backend_dir / 'app' / 'schemas' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_routers(self):
        """Consolidate API routers"""
        router_files = {
            'auth.py': self._merge_auth_router(),
            'predictions.py': self._merge_predictions_router(),
            'lineups.py': self._merge_lineups_router()
        }
        
        for filename, content in router_files.items():
            with open(self.backend_dir / 'app' / 'routers' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_services(self):
        """Consolidate business logic services"""
        service_files = {
            'auth.py': self._merge_auth_service(),
            'predictions.py': self._merge_predictions_service(),
            'lineups.py': self._merge_lineups_service()
        }
        
        for filename, content in service_files.items():
            with open(self.backend_dir / 'app' / 'services' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_utils(self):
        """Consolidate utility functions"""
        util_files = {
            'security.py': self._merge_security_utils(),
            'ml.py': self._merge_ml_utils()
        }
        
        for filename, content in util_files.items():
            with open(self.backend_dir / 'app' / 'utils' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _create_requirements(self):
        """Create requirements.txt with dependencies"""
        requirements = '''fastapi==0.100.0
uvicorn==0.22.0
sqlalchemy==2.0.19
pydantic==2.1.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pandas==2.0.3
numpy==1.24.3
scikit-learn==1.3.0
python-dotenv==1.0.0
alembic==1.11.2
pytest==7.4.0
httpx==0.24.1
'''
        
        with open(self.backend_dir / 'requirements.txt', 'w') as f:
            f.write(requirements)
        logging.info("Created requirements.txt")

    def _create_main(self):
        """Create main.py"""
        main_content = '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, predictions, lineups
from app.core.config import settings

app = FastAPI(
    title="AI Sports Betting API",
    description="API for AI-powered sports betting predictions and analytics",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(lineups.router, prefix="/api/lineups", tags=["lineups"])

@app.get("/")
async def root():
    return {"message": "Welcome to AI Sports Betting API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
'''
        
        with open(self.backend_dir / 'main.py', 'w') as f:
            f.write(main_content)
        logging.info("Created main.py")

    def _create_config(self):
        """Create config.py"""
        config_content = '''from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Sports Betting API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Frontend development server
        "http://localhost:3000",  # Alternative frontend port
    ]
    
    # ML Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/prediction_model.pkl")
    
    class Config:
        case_sensitive = True

settings = Settings()
'''
        
        with open(self.backend_dir / 'app' / 'core' / 'config.py', 'w') as f:
            f.write(config_content)
        logging.info("Created config.py")

    # Helper methods for merging files
    def _merge_user_model(self):
        """Merge user model"""
        return '''from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    predictions = relationship("Prediction", back_populates="user")
    lineups = relationship("Lineup", back_populates="user")
'''

    def _merge_prediction_model(self):
        """Merge prediction model"""
        return '''from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    player = Column(String, index=True)
    projected = Column(Float)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", back_populates="predictions")
'''

    def _merge_lineup_model(self):
        """Merge lineup model"""
        return '''from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Lineup(Base):
    __tablename__ = "lineups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    players = Column(JSON)
    total_projected = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", back_populates="lineups")
'''

    def _merge_user_schema(self):
        """Merge user schema"""
        return '''from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
'''

    def _merge_prediction_schema(self):
        """Merge prediction schema"""
        return '''from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PredictionBase(BaseModel):
    player: str
    projected: float
    confidence: float

class PredictionCreate(PredictionBase):
    pass

class PredictionUpdate(PredictionBase):
    pass

class PredictionInDBBase(PredictionBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class Prediction(PredictionInDBBase):
    pass

class PredictionInDB(PredictionInDBBase):
    pass
'''

    def _merge_lineup_schema(self):
        """Merge lineup schema"""
        return '''from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional

class LineupBase(BaseModel):
    name: str
    players: List[Dict]
    total_projected: float

class LineupCreate(LineupBase):
    pass

class LineupUpdate(LineupBase):
    pass

class LineupInDBBase(LineupBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class Lineup(LineupInDBBase):
    pass

class LineupInDB(LineupInDBBase):
    pass
'''

    def _merge_auth_router(self):
        """Merge auth router"""
        return '''from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user
)
from app.schemas.user import User, UserCreate
from app.services.auth import create_user

router = APIRouter()

@router.post("/login", response_model=dict)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    return create_user(user)

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
'''

    def _merge_predictions_router(self):
        """Merge predictions router"""
        return '''from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.prediction import Prediction, PredictionCreate
from app.services.predictions import (
    get_predictions,
    create_prediction,
    get_prediction,
    update_prediction,
    delete_prediction
)
from app.schemas.user import User
from app.services.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Prediction])
async def read_predictions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    return get_predictions(skip=skip, limit=limit, user_id=current_user.id)

@router.post("/", response_model=Prediction)
async def create_new_prediction(
    prediction: PredictionCreate,
    current_user: User = Depends(get_current_user)
):
    return create_prediction(prediction=prediction, user_id=current_user.id)

@router.get("/{prediction_id}", response_model=Prediction)
async def read_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user)
):
    prediction = get_prediction(prediction_id=prediction_id, user_id=current_user.id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

@router.put("/{prediction_id}", response_model=Prediction)
async def update_existing_prediction(
    prediction_id: int,
    prediction: PredictionCreate,
    current_user: User = Depends(get_current_user)
):
    updated_prediction = update_prediction(
        prediction_id=prediction_id,
        prediction=prediction,
        user_id=current_user.id
    )
    if updated_prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return updated_prediction

@router.delete("/{prediction_id}")
async def delete_existing_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user)
):
    success = delete_prediction(prediction_id=prediction_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"message": "Prediction deleted successfully"}
'''

    def _merge_lineups_router(self):
        """Merge lineups router"""
        return '''from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.lineup import Lineup, LineupCreate
from app.services.lineups import (
    get_lineups,
    create_lineup,
    get_lineup,
    update_lineup,
    delete_lineup,
    optimize_lineup
)
from app.schemas.user import User
from app.services.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Lineup])
async def read_lineups(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    return get_lineups(skip=skip, limit=limit, user_id=current_user.id)

@router.post("/", response_model=Lineup)
async def create_new_lineup(
    lineup: LineupCreate,
    current_user: User = Depends(get_current_user)
):
    return create_lineup(lineup=lineup, user_id=current_user.id)

@router.get("/{lineup_id}", response_model=Lineup)
async def read_lineup(
    lineup_id: int,
    current_user: User = Depends(get_current_user)
):
    lineup = get_lineup(lineup_id=lineup_id, user_id=current_user.id)
    if lineup is None:
        raise HTTPException(status_code=404, detail="Lineup not found")
    return lineup

@router.put("/{lineup_id}", response_model=Lineup)
async def update_existing_lineup(
    lineup_id: int,
    lineup: LineupCreate,
    current_user: User = Depends(get_current_user)
):
    updated_lineup = update_lineup(
        lineup_id=lineup_id,
        lineup=lineup,
        user_id=current_user.id
    )
    if updated_lineup is None:
        raise HTTPException(status_code=404, detail="Lineup not found")
    return updated_lineup

@router.delete("/{lineup_id}")
async def delete_existing_lineup(
    lineup_id: int,
    current_user: User = Depends(get_current_user)
):
    success = delete_lineup(lineup_id=lineup_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Lineup not found")
    return {"message": "Lineup deleted successfully"}

@router.post("/optimize", response_model=Lineup)
async def optimize_new_lineup(
    constraints: dict,
    current_user: User = Depends(get_current_user)
):
    return optimize_lineup(constraints=constraints, user_id=current_user.id)
'''

    def _merge_auth_service(self):
        """Merge auth service"""
        return '''from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(email: str, password: str, db: Session = Depends(get_db)) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def create_user(user: UserCreate, db: Session = Depends(get_db)) -> User:
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
'''

    def _merge_predictions_service(self):
        """Merge predictions service"""
        return '''from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate
from app.core.database import get_db

def get_predictions(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
) -> List[Prediction]:
    query = db.query(Prediction)
    if user_id:
        query = query.filter(Prediction.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_prediction(
    prediction: PredictionCreate,
    user_id: int,
    db: Session = Depends(get_db)
) -> Prediction:
    db_prediction = Prediction(**prediction.dict(), user_id=user_id)
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction

def get_prediction(
    prediction_id: int,
    user_id: int,
    db: Session = Depends(get_db)
) -> Optional[Prediction]:
    return db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == user_id
    ).first()

def update_prediction(
    prediction_id: int,
    prediction: PredictionCreate,
    user_id: int,
    db: Session = Depends(get_db)
) -> Optional[Prediction]:
    db_prediction = get_prediction(prediction_id, user_id, db)
    if db_prediction:
        for key, value in prediction.dict().items():
            setattr(db_prediction, key, value)
        db.commit()
        db.refresh(db_prediction)
    return db_prediction

def delete_prediction(
    prediction_id: int,
    user_id: int,
    db: Session = Depends(get_db)
) -> bool:
    db_prediction = get_prediction(prediction_id, user_id, db)
    if db_prediction:
        db.delete(db_prediction)
        db.commit()
        return True
    return False
'''

    def _merge_lineups_service(self):
        """Merge lineups service"""
        return '''from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.lineup import Lineup
from app.schemas.lineup import LineupCreate
from app.core.database import get_db
from app.utils.ml import optimize_lineup as ml_optimize_lineup

def get_lineups(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    db: Session = Depends(get_db)
) -> List[Lineup]:
    query = db.query(Lineup)
    if user_id:
        query = query.filter(Lineup.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_lineup(
    lineup: LineupCreate,
    user_id: int,
    db: Session = Depends(get_db)
) -> Lineup:
    db_lineup = Lineup(**lineup.dict(), user_id=user_id)
    db.add(db_lineup)
    db.commit()
    db.refresh(db_lineup)
    return db_lineup

def get_lineup(
    lineup_id: int,
    user_id: int,
    db: Session = Depends(get_db)
) -> Optional[Lineup]:
    return db.query(Lineup).filter(
        Lineup.id == lineup_id,
        Lineup.user_id == user_id
    ).first()

def update_lineup(
    lineup_id: int,
    lineup: LineupCreate,
    user_id: int,
    db: Session = Depends(get_db)
) -> Optional[Lineup]:
    db_lineup = get_lineup(lineup_id, user_id, db)
    if db_lineup:
        for key, value in lineup.dict().items():
            setattr(db_lineup, key, value)
        db.commit()
        db.refresh(db_lineup)
    return db_lineup

def delete_lineup(
    lineup_id: int,
    user_id: int,
    db: Session = Depends(get_db)
) -> bool:
    db_lineup = get_lineup(lineup_id, user_id, db)
    if db_lineup:
        db.delete(db_lineup)
        db.commit()
        return True
    return False

def optimize_lineup(
    constraints: dict,
    user_id: int,
    db: Session = Depends(get_db)
) -> Lineup:
    optimized_players = ml_optimize_lineup(constraints)
    lineup = LineupCreate(
        name="Optimized Lineup",
        players=optimized_players,
        total_projected=sum(player["projected"] for player in optimized_players)
    )
    return create_lineup(lineup=lineup, user_id=user_id, db=db)
'''

    def _merge_security_utils(self):
        """Merge security utilities"""
        return '''from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
'''

    def _merge_ml_utils(self):
        """Merge ML utilities"""
        return '''import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import List, Dict
import joblib
import os
from app.core.config import settings

def load_model() -> RandomForestRegressor:
    if os.path.exists(settings.MODEL_PATH):
        return joblib.load(settings.MODEL_PATH)
    return RandomForestRegressor()

def predict_player_performance(player_data: Dict) -> Dict:
    model = load_model()
    features = pd.DataFrame([player_data])
    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features)[0].max()
    return {
        "projected": float(prediction),
        "confidence": float(confidence)
    }

def optimize_lineup(constraints: Dict) -> List[Dict]:
    # Implement lineup optimization logic here
    # This is a placeholder implementation
    return [
        {
            "player": "Player 1",
            "projected": 25.5,
            "confidence": 0.85
        },
        {
            "player": "Player 2",
            "projected": 22.3,
            "confidence": 0.82
        }
    ]
'''

if __name__ == "__main__":
    consolidator = BackendConsolidator()
    consolidator.consolidate() 