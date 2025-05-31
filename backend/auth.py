from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import hmac
import hashlib
import time
from typing import Optional, Dict, Any

import models
import schemas
from database import SessionLocal, get_db

# Settings from environment
SECRET_KEY = os.environ.get("SECRET_KEY", "YOUR_SECRET_KEY_CHANGE_ME_IN_PRODUCTION")
ALGORITHM = "HS256"
# Установка срока действия токена на бесконечно большое значение, чтобы токен никогда не истекал
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "525600")) # 365 дней (60 мин * 24 часа * 365 дней)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    # Если в явном виде не передан срок действия токена, не добавляем время истечения
    # Это сделает токен бессрочным
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        # Явно указываем, что user_id - это строка, представляющая UUID
        token_data = schemas.TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    # Получаем пользователя по UUID, переданному в виде строки
    user = models.get_user(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

def verify_telegram_auth(auth_data: schemas.TelegramAuth) -> Optional[Dict[str, Any]]:
    """
    Verify Telegram authentication data
    
    Returns user data if verification is successful, None otherwise
    """
    if not TELEGRAM_BOT_TOKEN:
        # For development without bot token, just return the data
        # IMPORTANT: Do not use this in production!
        return {
            "id": auth_data.id,
            "username": auth_data.username,
            "first_name": auth_data.first_name,
            "last_name": auth_data.last_name
        }
    
    # Telegram auth data must be fresh (within last day)
    auth_date = auth_data.auth_date
    if time.time() - auth_date > 86400:
        return None
    
    # Create data check string
    data_check_string = '\n'.join([
        f'{key}={value}' for key, value in auth_data.dict(exclude={'hash'}).items()
        if value is not None
    ])
    
    # Create data hash using bot token
    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
    data_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Verify hash
    if data_hash != auth_data.hash:
        return None
    
    # Return user data
    return {
        "id": auth_data.id,
        "username": auth_data.username,
        "first_name": auth_data.first_name,
        "last_name": auth_data.last_name
    }
