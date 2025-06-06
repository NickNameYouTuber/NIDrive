from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..models.schemas import UserResponse, UserUpdate, UserStats
from ..models.user import User
from ..core.database import get_db
from ..core.auth import get_current_user
from ..services.user_service import update_user, get_user_stats

router = APIRouter(prefix="/api/v1/users")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get information about the current authenticated user"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_info(
    user_update: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update current user information"""
    updated_user = update_user(db, current_user, user_update)
    return updated_user

@router.get("/me/stats", response_model=UserStats)
async def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about user's storage usage"""
    stats = get_user_stats(db, current_user)
    return stats
