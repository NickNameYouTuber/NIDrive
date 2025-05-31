"""
Модуль проверки работоспособности API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from typing import Dict, Any
import psutil
import os
import platform
import sys

router = APIRouter(
    prefix="/api/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Базовая проверка работоспособности API"""
    return {
        "status": "healthy",
        "message": "API работает нормально"
    }

@router.get("/detailed")
async def detailed_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Расширенная проверка состояния API с информацией о системе"""
    # Проверка соединения с БД
    try:
        # Простой запрос для проверки соединения
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Информация о системе
    memory = psutil.virtual_memory()
    
    return {
        "status": "healthy",
        "database": db_status,
        "system": {
            "os": platform.platform(),
            "python": sys.version,
            "cpu_usage": psutil.cpu_percent(interval=0.1),
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent_used": memory.percent
            },
            "disk": {
                "usage": psutil.disk_usage('/').percent
            }
        }
    }

@router.get("/cors-test")
async def cors_test() -> Dict[str, Any]:
    """Тестовый эндпоинт для проверки CORS"""
    return {
        "cors": "enabled",
        "message": "Если вы видите это сообщение, CORS настроен правильно"
    }
