from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime, timedelta
import uuid

class FileBase(BaseModel):
    """Базовая модель для файлов"""
    filename: str = Field(..., description="Оригинальное имя файла")
    folder: Optional[str] = Field(None, description="Логическая папка для организации файлов")
    description: Optional[str] = Field(None, description="Описание файла")
    tags: Optional[str] = Field(None, description="Теги через запятую")
    is_public: bool = Field(False, description="Флаг публичного доступа")

class FileCreate(FileBase):
    """Модель для создания файла"""
    pass

class FileUpdate(BaseModel):
    """Модель для обновления файла"""
    filename: Optional[str] = Field(None, description="Оригинальное имя файла")
    folder: Optional[str] = Field(None, description="Логическая папка для организации файлов")
    description: Optional[str] = Field(None, description="Описание файла")
    tags: Optional[str] = Field(None, description="Теги через запятую")
    is_public: Optional[bool] = Field(None, description="Флаг публичного доступа")

class File(FileBase):
    """Полная модель файла для возврата клиенту"""
    id: str = Field(..., description="Уникальный идентификатор файла")
    user_id: str = Field(..., description="Идентификатор владельца файла")
    file_size: int = Field(..., description="Размер файла в байтах")
    mime_type: Optional[str] = Field(None, description="MIME-тип файла")
    
    # Метрики использования
    download_count: int = Field(0, description="Счетчик скачиваний")
    view_count: int = Field(0, description="Счетчик просмотров")
    last_accessed: Optional[datetime] = Field(None, description="Время последнего доступа")
    
    # Данные о доступе
    access_token: Optional[str] = Field(None, description="Токен для доступа к файлу по ссылке")
    
    # Ссылки для доступа
    private_url: str = Field(..., description="Ссылка для приватного доступа")
    public_url: Optional[str] = Field(None, description="Публичная ссылка (если файл публичный)")
    
    created_at: datetime = Field(..., description="Дата создания")
    updated_at: datetime = Field(..., description="Дата обновления")

    class Config:
        from_attributes = True

class FileInFolder(BaseModel):
    """Упрощенная модель файла для отображения в списке"""
    id: str
    filename: str
    file_size: int
    mime_type: Optional[str] = None
    is_public: bool
    folder: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FolderInfo(BaseModel):
    """Информация о папке"""
    name: str
    file_count: int
    total_size: int

class FileList(BaseModel):
    """Список файлов с пагинацией"""
    items: List[FileInFolder]
    total: int
    page: int
    size: int
    has_more: bool

class FileAccessToken(BaseModel):
    """Токен для доступа к файлу"""
    file_id: str
    access_token: str
    public_url: str

class FileStats(BaseModel):
    """Статистика использования файла"""
    id: str
    filename: str
    view_count: int
    download_count: int
    last_accessed: Optional[datetime] = None

class UserBase(BaseModel):
    telegram_id: int
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

class StorageInfo(BaseModel):
    used: int = Field(..., description="Used storage in bytes")
    total: int = Field(..., description="Total available storage in bytes")
    percentage: float = Field(..., description="Percentage of used storage")

class Message(BaseModel):
    message: str


