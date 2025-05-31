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
    
    # Связь с файлами будет реализована в новой системе


# Файловая система будет реализована с использованием специализированной БД для файлов


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


# Файловые функции будут перенесены в новый модуль специализированного хранилища


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

