from pydantic import BaseModel, EmailStr
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
