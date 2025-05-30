from pydantic import BaseModel, Field
from typing import Optional, List, Union
import datetime
import uuid

class FileBase(BaseModel):
    filename: str
    folder: Optional[str] = None
    is_public: Optional[bool] = False

class FileCreate(FileBase):
    pass

class File(FileBase):
    id: str
    user_id: str
    file_url: str
    public_url: Optional[str] = None
    file_size: int
    is_public: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TelegramAuth(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AuthCode(BaseModel):
    code: str
    telegram_id: Optional[int] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    expires_at: datetime.datetime = None
    is_used: bool = False

class AuthCodeCreate(BaseModel):
    code: str

class AuthCodeResponse(BaseModel):
    code: str
    message: str = "Auth code registered successfully"

class AuthCodeCheck(BaseModel):
    authenticated: bool
    user_id: Optional[int] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

class StorageInfo(BaseModel):
    used: int = Field(..., description="Used storage in bytes")
    total: int = Field(..., description="Total available storage in bytes")
    percentage: float = Field(..., description="Percentage of used storage")

class Message(BaseModel):
    message: str
