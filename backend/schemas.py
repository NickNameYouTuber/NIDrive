from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime, timedelta
import uuid

# Схемы для файлов будут перенесены в новый модуль файлового хранилища

class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: str
    created_at: datetime

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = None
    is_used: bool = False

class AuthCodeCreate(BaseModel):
    code: str

class AuthCodeResponse(BaseModel):
    code: str
    message: str = "Auth code registered successfully"

class AuthCodeCheck(BaseModel):
    authenticated: bool
    user_id: Optional[str] = None  # Поддержка UUID в виде строки
    access_token: Optional[str] = None
    token_type: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Класс для новой информации о хранилище будет переделан

class Message(BaseModel):
    message: str


