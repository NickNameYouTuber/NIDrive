from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Telegram Authentication Schemas
class TelegramAuth(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_id: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    used_space: float
    quota: float
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool

    class Config:
        orm_mode = True

# Folder Schemas
class FolderBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None

class FolderResponse(FolderBase):
    id: int
    owner_id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        orm_mode = True

class FolderTree(BaseModel):
    id: int
    name: str
    owner_id: str
    parent_id: Optional[int] = None
    children: List['FolderTree'] = []
    files: List['FileResponse'] = []

    class Config:
        orm_mode = True

# File Schemas
class FileBase(BaseModel):
    filename: str
    folder_id: Optional[int] = None
    is_public: bool = False

class FileCreate(FileBase):
    pass

class FileUpdate(BaseModel):
    filename: Optional[str] = None
    folder_id: Optional[int] = None
    is_public: Optional[bool] = None

class FileResponse(FileBase):
    id: int
    owner_id: str
    size_mb: float
    mime_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    public_url: Optional[str] = None

    class Config:
        orm_mode = True

# User Stats Schema
class UserStats(BaseModel):
    total_files: int
    total_folders: int
    used_space: float
    quota: float
    usage_percent: float
