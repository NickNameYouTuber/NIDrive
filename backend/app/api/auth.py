from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..models.schemas import TelegramAuth, Token, UserCreate, UserResponse
from ..core.database import get_db
from ..core.auth import verify_telegram_hash, create_access_token
from ..core.config import settings
from ..models.user import User
from ..services.user_service import get_user_by_telegram_id, create_user_if_not_exists

router = APIRouter(prefix="/api/v1/auth")

@router.post("/telegram-login", response_model=Token)
async def telegram_login(auth_data: dict, db: Session = Depends(get_db)):
    """
    Authenticate user with Telegram Login Widget data.
    Verify the hash, then create or update the user record and return an access token.
    """
    # Verify the Telegram authentication hash
    if not verify_telegram_hash(auth_data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication data from Telegram"
        )
    
    # Extract user info from auth data
    telegram_id = str(auth_data.get("id"))
    user_data = {
        "telegram_id": telegram_id,
        "first_name": auth_data.get("first_name", ""),
        "last_name": auth_data.get("last_name"),
        "username": auth_data.get("username"),
        "photo_url": auth_data.get("photo_url")
    }
    
    # Create or update the user
    user = create_user_if_not_exists(db, UserCreate(**user_data))
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": telegram_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
