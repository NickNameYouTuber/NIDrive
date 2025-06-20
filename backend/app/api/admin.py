from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..models.schemas import AdminUserResponse, UserQuotaUpdate
from ..models.user import User
from ..core.database import get_db
from ..core.auth import get_current_user
from ..services.user_service import get_all_users, update_user_quota

router = APIRouter(prefix="/api/v1/admin")

# Функция для проверки, является ли пользователь администратором
async def get_admin_user(current_user: User = Depends(get_current_user)):
    # Здесь можно реализовать проверку на права администратора
    # Например, по списку telegram_id или специальному полю в базе данных
    admin_telegram_ids = ["947630051"]  # Замените на реальные ID администраторов
    
    if current_user.telegram_id not in admin_telegram_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )
    return current_user

@router.get("/users", response_model=List[AdminUserResponse])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Получить список всех пользователей системы.
    Только для администраторов.
    """
    users = get_all_users(db, skip=skip, limit=limit)
    return users

@router.put("/users/{user_id}/quota", response_model=AdminUserResponse)
async def update_user_disk_quota(
    user_id: int,
    quota_update: UserQuotaUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Обновить квоту дискового пространства для пользователя.
    Только для администраторов.
    """
    updated_user = update_user_quota(db, user_id, quota_update.quota)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return updated_user
