from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger, Text, func, Boolean
from sqlalchemy.orm import relationship, Session
from datetime import datetime, timedelta
import uuid
from typing import Optional, List

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    telegram_id = Column(BigInteger, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    filename = Column(String, index=True)
    file_path = Column(String)
    file_url = Column(String)  # Ссылка для доступа к файлу
    public_url = Column(String, nullable=True)  # Анонимная публичная ссылка
    file_size = Column(BigInteger)  # Size in bytes
    folder = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)  # Флаг публичного/личного файла
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="files")


class AuthCode(Base):
    __tablename__ = "auth_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    telegram_id = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)
    is_used = Column(Integer, default=0)  # 0 = unused, 1 = used


# User functions
def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_telegram_id(db: Session, telegram_id: int) -> Optional[User]:
    return db.query(User).filter(User.telegram_id == telegram_id).first()

def create_user(db: Session, telegram_id: int, username: Optional[str] = None, 
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
    return db.query(File).filter(File.id == file_id).first()

def get_file_by_public_url(db: Session, public_url: str) -> Optional[File]:
    return db.query(File).filter(File.public_url == public_url, File.is_public == True).first()

def get_user_files(db: Session, user_id: str) -> List[File]:
    return db.query(File).filter(File.user_id == user_id).all()

def create_file(db: Session, user_id: str, filename: str, file_path: str, 
                file_url: str, file_size: int, folder: Optional[str] = None, 
                is_public: bool = False, public_url: Optional[str] = None) -> File:
    db_file = File(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_url=file_url,
        public_url=public_url,
        file_size=file_size,
        folder=folder,
        is_public=is_public
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def delete_file(db: Session, file_id: str) -> None:
    db_file = db.query(File).filter(File.id == file_id).first()
    if db_file:
        db.delete(db_file)
        db.commit()

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
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
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
    if db_code and db_code.expires_at > datetime.datetime.utcnow():
        db_code.telegram_id = telegram_id
        db.commit()
        db.refresh(db_code)
        return db_code
    return None


def mark_code_as_used(db: Session, code: str) -> Optional[AuthCode]:
    """Mark an auth code as used"""
    db_code = get_auth_code(db, code)
    if db_code and not db_code.is_used and db_code.expires_at > datetime.datetime.utcnow():
        db_code.is_used = 1
        db.commit()
        db.refresh(db_code)
        return db_code
    return None
