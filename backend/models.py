from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger, Text, func, Boolean
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timedelta
import uuid
from typing import Optional, List

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    telegram_id = Column(String, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    filename = Column(String, index=True)  # Оригинальное имя файла
    file_path = Column(String)  # Физический путь к файлу на диске
    file_size = Column(BigInteger)  # Размер файла в байтах
    mime_type = Column(String, nullable=True)  # MIME-тип файла
    
    # Метаданные файла
    folder = Column(String, nullable=True)  # Логическая папка для организации файлов
    description = Column(String, nullable=True)  # Описание файла
    tags = Column(String, nullable=True)  # Теги через запятую
    
    # Настройки доступа
    is_public = Column(Boolean, default=False)  # Флаг публичного доступа
    access_token = Column(String, nullable=True, index=True)  # Токен для доступа к файлу по ссылке
    
    # Метрики использования
    download_count = Column(Integer, default=0)  # Счетчик скачиваний
    view_count = Column(Integer, default=0)  # Счетчик просмотров
    last_accessed = Column(DateTime, nullable=True)  # Время последнего доступа
    
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Дата обновления
    
    owner = relationship("User", back_populates="files")


class AuthCode(Base):
    __tablename__ = "auth_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    telegram_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    is_used = Column(Integer, default=0)  # 0 = unused, 1 = used


# User functions
def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_telegram_id(db: Session, telegram_id: str) -> Optional[User]:
    return db.query(User).filter(User.telegram_id == telegram_id).first()

def create_user(db: Session, telegram_id: str, username: Optional[str] = None, 
                first_name: Optional[str] = None, last_name: Optional[str] = None) -> User:
    db_user = User(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# File functions
def get_file(db: Session, file_id: str) -> Optional[File]:
    """Получить файл по его ID"""
    return db.query(File).filter(File.id == file_id).first()

def get_file_by_access_token(db: Session, access_token: str) -> Optional[File]:
    """Получить файл по токену доступа"""
    return db.query(File).filter(File.access_token == access_token).first()

def get_user_files(db: Session, user_id: str, folder: Optional[str] = None) -> List[File]:
    """Получить все файлы пользователя, опционально фильтруя по папке"""
    query = db.query(File).filter(File.user_id == user_id)
    
    if folder:
        query = query.filter(File.folder == folder)
    
    return query.order_by(File.created_at.desc()).all()

def get_public_files(db: Session, user_id: str) -> List[File]:
    """Получить все публичные файлы пользователя"""
    return db.query(File).filter(
        File.user_id == user_id,
        File.is_public == True
    ).order_by(File.created_at.desc()).all()

def search_files(db: Session, user_id: str, query: str) -> List[File]:
    """Поиск файлов пользователя по имени, описанию или тегам"""
    search = f"%{query}%"
    return db.query(File).filter(
        File.user_id == user_id,
        (File.filename.ilike(search) | 
         File.description.ilike(search) | 
         File.tags.ilike(search))
    ).order_by(File.created_at.desc()).all()

def create_file(db: Session, user_id: str, filename: str, file_path: str, 
                file_size: int, mime_type: Optional[str] = None, folder: Optional[str] = None, 
                description: Optional[str] = None, tags: Optional[str] = None,
                is_public: bool = False, access_token: Optional[str] = None) -> File:
    """Создать новую запись о файле в базе данных"""
    db_file = File(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        folder=folder,
        description=description,
        tags=tags,
        is_public=is_public,
        access_token=access_token
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def update_file(db: Session, file_id: str, **kwargs) -> Optional[File]:
    """Обновить данные файла"""
    db_file = get_file(db, file_id)
    
    if not db_file:
        return None
    
    # Обновляем только переданные поля
    for key, value in kwargs.items():
        if hasattr(db_file, key):
            setattr(db_file, key, value)
    
    db.commit()
    db.refresh(db_file)
    return db_file

def delete_file(db: Session, file_id: str) -> bool:
    """Удалить файл из базы данных"""
    db_file = db.query(File).filter(File.id == file_id).first()
    
    if not db_file:
        return False
    
    db.delete(db_file)
    db.commit()
    return True

def increment_file_view_count(db: Session, file_id: str) -> Optional[File]:
    """Увеличить счетчик просмотров файла"""
    db_file = get_file(db, file_id)
    
    if not db_file:
        return None
    
    db_file.view_count += 1
    db_file.last_accessed = datetime.utcnow()
    db.commit()
    db.refresh(db_file)
    return db_file

def increment_file_download_count(db: Session, file_id: str) -> Optional[File]:
    """Увеличить счетчик скачиваний файла"""
    db_file = get_file(db, file_id)
    
    if not db_file:
        return None
    
    db_file.download_count += 1
    db_file.last_accessed = datetime.utcnow()
    db.commit()
    db.refresh(db_file)
    return db_file

def get_user_storage_usage(db: Session, user_id: str) -> int:
    """Get total storage usage for a user in bytes"""
    result = db.query(func.sum(File.file_size)).filter(File.user_id == user_id).scalar()
    return result or 0


def set_file_public_status(db: Session, file_id: str, is_public: bool, public_url: Optional[str] = None) -> File:
    """Set the public status of a file and optionally update its public URL"""
    db_file = db.query(File).filter(File.id == file_id).first()
    if db_file:
        db_file.is_public = is_public
        if is_public and public_url:
            db_file.public_url = public_url
        elif not is_public:
            db_file.public_url = None
            
        db.commit()
        db.refresh(db_file)
    return db_file


# Auth code functions
def create_auth_code(db: Session, code: str) -> AuthCode:
    """Create a new authorization code"""
    # Expires in 15 minutes
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    db_code = AuthCode(
        code=code,
        expires_at=expires_at
    )
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    return db_code


def get_auth_code(db: Session, code: str) -> Optional[AuthCode]:
    """Get an auth code by its value"""
    return db.query(AuthCode).filter(AuthCode.code == code).first()


def assign_telegram_user_to_code(db: Session, code: str, telegram_id: int) -> Optional[AuthCode]:
    """Assign a Telegram user ID to an auth code"""
    db_code = get_auth_code(db, code)
    if db_code and db_code.expires_at > datetime.utcnow():
        db_code.telegram_id = telegram_id
        db.commit()
        db.refresh(db_code)
        return db_code
    return None


def mark_code_as_used(db: Session, code: str) -> Optional[AuthCode]:
    """Mark an auth code as used"""
    db_code = get_auth_code(db, code)
    if db_code and not db_code.is_used and db_code.expires_at > datetime.utcnow():
        db_code.is_used = 1
        db.commit()
        db.refresh(db_code)
        return db_code
    return None

