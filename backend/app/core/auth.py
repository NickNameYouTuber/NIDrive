import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from .config import settings
from ..models.user import User
from ..core.database import get_db

# OAuth2 setup for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# JWT token creation and verification
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Function to get the current user from the token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = verify_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.telegram_id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Telegram authentication - hash verification
def verify_telegram_hash(data: Dict[str, Any]) -> bool:
    """
    Verify the hash received from Telegram Login Widget.
    The hash is an HMAC-SHA256 signature of the data-check-string with the secret key,
    which is the SHA256 hash of the bot token.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram bot token not configured"
        )
    
    # Extract the hash from the data
    received_hash = data.get("hash", "")
    if not received_hash:
        return False
    
    # Remove hash from the data for verification
    auth_data = {k: v for k, v in data.items() if k != "hash"}
    
    # Check if auth_date is too old (older than 1 day)
    auth_date = int(auth_data.get("auth_date", 0))
    if time.time() - auth_date > 86400:
        return False
    
    # Sort the data alphabetically and create data-check-string
    data_check_arr = []
    for key in sorted(auth_data.keys()):
        data_check_arr.append(f"{key}={auth_data[key]}")
    data_check_string = "\n".join(data_check_arr)
    
    # Create the secret key as SHA256 hash of the bot token
    secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    
    # Calculate the expected hash
    expected_hash = hmac.new(
        secret_key, 
        data_check_string.encode(), 
        hashlib.sha256
    ).hexdigest()
    
    # Verify that the received hash matches the expected hash
    return received_hash == expected_hash
