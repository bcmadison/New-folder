from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    email: str
    username: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str # Or int, depending on your DB
    model_config = ConfigDict(from_attributes=True)

# This can be expanded with UserInDB, UserUpdate, etc. 