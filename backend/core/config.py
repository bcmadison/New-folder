from pydantic_settings import BaseSettings
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
