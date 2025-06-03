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
        self.root_dir = Path.cwd()
        self.final_app_dir = self.root_dir / 'finalApp'
        self.backend_dir = self.final_app_dir / 'backend'
        self.source_dirs = {
            'app': self.root_dir / 'backend' / 'app',
            'api': self.root_dir / 'backend' / 'api',
            'services': self.root_dir / 'backend' / 'services',
            'models': self.root_dir / 'backend' / 'models',
            'schemas': self.root_dir / 'backend' / 'schemas',
            'core': self.root_dir / 'backend' / 'core',
            'tests': self.root_dir / 'backend' / 'tests'
        }

    def consolidate(self):
        """Main consolidation process"""
        logging.info("Starting backend consolidation...")
        
        # Create necessary directories
        self._create_directories()
        
        # Consolidate core files
        self._consolidate_core()
        
        # Consolidate API endpoints
        self._consolidate_api()
        
        # Consolidate services
        self._consolidate_services()
        
        # Consolidate models and schemas
        self._consolidate_models_schemas()
        
        # Consolidate tests
        self._consolidate_tests()
        
        # Create requirements.txt
        self._create_requirements()
        
        # Create .env file
        self._create_env_file()
        
        logging.info("Backend consolidation complete!")

    def _create_directories(self):
        """Create necessary directory structure"""
        directories = [
            'app/api/v1/endpoints',
            'app/core',
            'app/models',
            'app/services',
            'app/schemas',
            'tests/unit',
            'tests/integration'
        ]
        
        for dir_path in directories:
            (self.backend_dir / dir_path).mkdir(parents=True, exist_ok=True)
            logging.info(f"Created directory: {dir_path}")

    def _consolidate_core(self):
        """Consolidate core functionality"""
        core_files = {
            'config.py': self._merge_config_files(),
            'database.py': self._merge_database_files(),
            'logger.py': self._merge_logger_files(),
            'auth.py': self._merge_auth_files()
        }
        
        for filename, content in core_files.items():
            with open(self.backend_dir / 'app' / 'core' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_api(self):
        """Consolidate API endpoints"""
        api_files = {
            'predictions.py': self._merge_prediction_endpoints(),
            'lineup.py': self._merge_lineup_endpoints(),
            'analytics.py': self._merge_analytics_endpoints(),
            'health.py': self._merge_health_endpoints()
        }
        
        for filename, content in api_files.items():
            with open(self.backend_dir / 'app' / 'api' / 'v1' / 'endpoints' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_services(self):
        """Consolidate service layer"""
        service_files = {
            'ml_service.py': self._merge_ml_services(),
            'data_service.py': self._merge_data_services(),
            'analytics_service.py': self._merge_analytics_services()
        }
        
        for filename, content in service_files.items():
            with open(self.backend_dir / 'app' / 'services' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_models_schemas(self):
        """Consolidate models and schemas"""
        model_files = {
            'user.py': self._merge_user_models(),
            'prediction.py': self._merge_prediction_models(),
            'lineup.py': self._merge_lineup_models()
        }
        
        for filename, content in model_files.items():
            with open(self.backend_dir / 'app' / 'models' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_tests(self):
        """Consolidate test files"""
        test_files = {
            'test_api.py': self._merge_api_tests(),
            'test_services.py': self._merge_service_tests(),
            'test_models.py': self._merge_model_tests()
        }
        
        for filename, content in test_files.items():
            with open(self.backend_dir / 'tests' / 'unit' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _create_requirements(self):
        """Create consolidated requirements.txt"""
        requirements = {
            'fastapi': '0.68.0',
            'uvicorn': '0.15.0',
            'sqlalchemy': '1.4.23',
            'pydantic': '1.8.2',
            'python-jose': '3.3.0',
            'passlib': '1.7.4',
            'python-multipart': '0.0.5',
            'aiohttp': '3.8.1',
            'numpy': '1.21.2',
            'pandas': '1.3.3',
            'scikit-learn': '0.24.2',
            'xgboost': '1.4.2',
            'lightgbm': '3.2.1',
            'redis': '3.5.3',
            'pytest': '6.2.5',
            'pytest-asyncio': '0.15.1',
            'httpx': '0.19.0'
        }
        
        with open(self.backend_dir / 'requirements.txt', 'w') as f:
            for package, version in requirements.items():
                f.write(f"{package}=={version}\n")
        logging.info("Created requirements.txt")

    def _create_env_file(self):
        """Create consolidated .env file"""
        env_vars = {
            'PORT': '8000',
            'HOST': '0.0.0.0',
            'API_BASE_URL': 'http://localhost:8000',
            'DATABASE_URL': 'sqlite:///./app.db',
            'JWT_SECRET': 'your-secret-key',
            'JWT_ALGORITHM': 'HS256',
            'ACCESS_TOKEN_EXPIRE_MINUTES': '30',
            'ML_MODEL_PATH': 'models/',
            'ML_CONFIDENCE_THRESHOLD': '0.6',
            'LOG_LEVEL': 'INFO',
            'REDIS_URL': 'redis://localhost:6379'
        }
        
        with open(self.backend_dir / '.env', 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        logging.info("Created .env file")

    # Helper methods for merging files
    def _merge_config_files(self):
        """Merge configuration files"""
        return '''from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "AI Sports Betting Platform"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Authentication
    JWT_SECRET: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ML
    ML_MODEL_PATH: str = "models/"
    ML_CONFIDENCE_THRESHOLD: float = 0.6
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
'''

    def _merge_database_files(self):
        """Merge database files"""
        return '''from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''

    def _merge_logger_files(self):
        """Merge logger files"""
        return '''import logging
import sys
from pathlib import Path
from datetime import datetime
from logging.handlers import RotatingFileHandler

def setup_logger():
    logger = logging.getLogger("app")
    logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_format)
    
    # File handler
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    file_handler = RotatingFileHandler(
        log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log",
        maxBytes=10485760,
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_format)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

logger = setup_logger()
'''

    def _merge_auth_files(self):
        """Merge authentication files"""
        return '''from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
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
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt
'''

    # Additional helper methods for merging other files
    def _merge_prediction_endpoints(self):
        """Merge prediction endpoint files"""
        return '''from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.ml_service import MLService
from app.models.prediction import Prediction

router = APIRouter()
ml_service = MLService()

@router.get("/predictions", response_model=List[Prediction])
async def get_predictions():
    return await ml_service.get_predictions()

@router.post("/predictions/analyze")
async def analyze_prediction(prediction_id: int):
    return await ml_service.analyze_prediction(prediction_id)
'''

    def _merge_lineup_endpoints(self):
        """Merge lineup endpoint files"""
        return '''from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.lineup_service import LineupService
from app.models.lineup import Lineup

router = APIRouter()
lineup_service = LineupService()

@router.get("/lineups", response_model=List[Lineup])
async def get_lineups():
    return await lineup_service.get_lineups()

@router.post("/lineups/optimize")
async def optimize_lineup():
    return await lineup_service.optimize_lineup()
'''

    def _merge_analytics_endpoints(self):
        """Merge analytics endpoint files"""
        return '''from fastapi import APIRouter, Depends, HTTPException
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

@router.get("/analytics/performance")
async def get_performance_metrics():
    return await analytics_service.get_performance_metrics()

@router.get("/analytics/trends")
async def get_trends():
    return await analytics_service.get_trends()
'''

    def _merge_health_endpoints(self):
        """Merge health endpoint files"""
        return '''from fastapi import APIRouter
from app.core.logger import logger

router = APIRouter()

@router.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy"}
'''

if __name__ == "__main__":
    consolidator = BackendConsolidator()
    consolidator.consolidate() 