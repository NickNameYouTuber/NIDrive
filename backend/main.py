from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Request
import logging
from datetime import datetime, timedelta
from starlette.responses import RedirectResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Настройка логгера
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from typing import List, Optional
import uuid
import shutil
from pathlib import Path
import json
import jwt
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
import models
import schemas
import uuid
from auth import get_current_user, create_access_token, verify_telegram_auth

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NIDriveBot API", description="File storage backend service")

# Configure CORS
# Обновленные настройки CORS с детальными разрешениями
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7071", 
        "http://127.0.0.1:7071",
        "http://localhost:5173",  # Vite dev server по умолчанию
        "https://drive.nicorp.tech",  # Продакшен домен
        "http://drive.nicorp.tech",   # HTTP версия
        "https://nicorp.tech",         # Основной домен
        "http://nicorp.tech",
        "http://backend:7070",         # Docker сервис
        "http://frontend:7071",        # Docker сервис
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Явно указываем разрешенные методы
    allow_headers=["Authorization", "Content-Type"],  # Явно указываем разрешенные заголовки
    expose_headers=["Content-Type"],
    max_age=600,  # Кэширование запросов preflight на 10 минут
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API keys and security
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
OAUTH_REDIRECT_URL = os.getenv("OAUTH_REDIRECT_URL", "http://localhost:5173/auth/success")
OAUTH_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID")
OAUTH_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Новая конфигурация файлового хранилища
MAX_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024  # 5GB

# Загрузка маршрутов файлового API
from file_routes import router as file_router, get_storage

# Используем новый механизм проверки доступа вместо мидлвари

# Подключаем маршруты файлового API с префиксом /api для совместимости с фронтендом
app.include_router(file_router, prefix="/api", tags=["files"])

# Создаем дополнительные маршруты для обратной совместимости
@app.get("/storage/usage")
async def storage_usage(current_user = Depends(get_current_user)):
    # Перенаправляем на маршрут /api/storage-info
    from file_routes import get_storage_info
    return await get_storage_info(current_user=current_user, storage_service=next(get_storage()))

# Редирект со старого пути /files на /api/files
@app.get("/files")
async def files_redirect(current_user = Depends(get_current_user)):
    # Перенаправляем на маршрут /api/files
    from file_routes import list_files
    return await list_files(current_user=current_user, storage_service=next(get_storage()))

# Все маршруты для файлов перемещены в file_routes.py

# Все маршруты для публичных файлов перемещены в file_routes.py
    
# Все эндпоинты обратной совместимости перемещены в file_routes.py

# Все эндпоинты прямого доступа к файлам пользователя перемещены в file_routes.py

@app.get("/")
def read_root():
    return {"message": "Welcome to NIDriveBot API"}

@app.post("/auth/telegram-login")
def telegram_login(auth_data: schemas.TelegramAuth, db: Session = Depends(get_db)):
    """Handle Telegram authentication"""
    # Verify the authentication data from Telegram
    user_data = verify_telegram_auth(auth_data)
    if not user_data:
        raise HTTPException(status_code=400, detail="Invalid authentication data")
    
    # Check if user exists, if not create new user
    user = models.get_user_by_telegram_id(db, user_data["id"])
    if not user:
        user = models.create_user(
            db=db,
            telegram_id=user_data["id"],
            username=user_data.get("username"),
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
        )
        # Create user directory
        user_dir = Path(UPLOAD_DIR) / str(user.id)
        user_dir.mkdir(exist_ok=True)
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


# Auth code system for Telegram bot login
@app.post("/auth/register-code", response_model=schemas.AuthCodeResponse)
def register_auth_code(code_data: schemas.AuthCodeCreate, db: Session = Depends(get_db)):
    """Register a new authorization code"""
    # Check if code already exists
    existing_code = models.get_auth_code(db, code_data.code)
    if existing_code:
        # If code exists but is expired, delete it and create a new one
        if existing_code.expires_at < datetime.utcnow():
            db.delete(existing_code)
            db.commit()
        else:
            return {"code": code_data.code, "message": "Auth code already registered"}
    
    # Create new auth code
    models.create_auth_code(db, code_data.code)
    
    return {"code": code_data.code, "message": "Auth code registered successfully"}



@app.get("/auth/check-code", response_model=schemas.AuthCodeCheck)
def check_auth_code(code: str, db: Session = Depends(get_db)):
    """Check if an auth code has been used by a Telegram user"""
    db_code = models.get_auth_code(db, code)
    
    # Code not found or expired
    if not db_code or db_code.expires_at < datetime.utcnow():
        return {"authenticated": False}
    
    # Code used by a Telegram user
    if db_code.telegram_id:
        # Check if user exists
        user = models.get_user_by_telegram_id(db, db_code.telegram_id)
        if not user:
            # Create new user
            user = models.create_user(db, db_code.telegram_id)
            # Инициализация пользователя в новой системе хранилища будет происходить в file_routes.py
        
        # Mark code as used
        models.mark_code_as_used(db, code)
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Важно: возвращаем user_id как строку, т.к. в БД он хранится как UUID
        return schemas.AuthCodeCheck(
            authenticated=True,
            user_id=str(user.id),
            access_token=access_token,
            token_type="bearer"
        )
    
    # Code not yet used
    return {"authenticated": False}


@app.post("/auth/process-code")
async def process_auth_code(request: Request, db: Session = Depends(get_db)):
    """Process an auth code from Telegram bot (called by the bot)"""
    # Получаем параметры из различных источников
    params = {}
    # Из URL параметров
    for key, value in request.query_params.items():
        params[key] = value
    
    # Попытка получить из тела запроса (JSON)
    try:
        body_data = await request.json()
        for key, value in body_data.items():
            params[key] = value
    except:
        # Если не JSON, возможно form-data
        try:
            form_data = await request.form()
            for key, value in form_data.items():
                params[key] = value
        except:
            pass
    
    # Получаем необходимые параметры
    code = params.get("code")
    telegram_id = params.get("telegram_id")
    username = params.get("username")
    first_name = params.get("first_name")
    last_name = params.get("last_name")
    
    # Логирование для отладки
    logger.info(f"Получены параметры: code={code}, telegram_id={telegram_id}, username={username}")
    logger.info(f"Все параметры: {params}")
    
    # Проверяем, что параметры не None
    if not code or not telegram_id:
        raise HTTPException(status_code=400, detail="Missing required parameters: code and telegram_id")
    
    # Преобразуем telegram_id в int, если он строка
    if isinstance(telegram_id, str):
        try:
            telegram_id = int(telegram_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="telegram_id must be an integer")
    
    # Check if code exists and is valid
    db_code = models.get_auth_code(db, code)
    if not db_code:
        raise HTTPException(status_code=400, detail="Auth code not found")
    
    if db_code.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Auth code has expired")
    
    if db_code.is_used:
        raise HTTPException(status_code=400, detail="Auth code already used")
    
    # Находим или создаем пользователя с полными данными профиля
    user = models.get_user_by_telegram_id(db, telegram_id)
    if not user:
        # Создаем нового пользователя с данными профиля
        user = models.create_user(db, telegram_id, username, first_name, last_name)
        logger.info(f"Создан новый пользователь: {user.id} (Телеграм ID: {telegram_id})")
    else:
        # Обновляем существующего пользователя
        if username and not user.username:
            user.username = username
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        db.commit()
        logger.info(f"Обновлен пользователь: {user.id} (Телеграм ID: {telegram_id})")
    
    # Привязываем код к пользователю Telegram
    updated_code = models.assign_telegram_user_to_code(db, code, telegram_id)
    if not updated_code:
        raise HTTPException(status_code=400, detail="Failed to process auth code")
    
    return {"success": True, "message": "Auth code processed successfully"}

@app.get("/users/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information"""
    # Преобразуем модель в дикт и превращаем telegram_id в строку, если это необходимо
    user_dict = {
        "id": current_user.id,
        "telegram_id": str(current_user.telegram_id),  # Преобразуем в строку
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "created_at": current_user.created_at
    }
    return user_dict

# Список файлов пользователя теперь доступен через новые маршруты

# Информация о файле доступна через новые маршруты

# Загрузка файлов реализована в новой системе


# Функция переключения приватности перенесена в новое хранилище

# Удаление файла реализовано в новой системе

# Маршруты для управления приватностью файлов перемещены в file_routes.py

# Информация об использовании хранилища перемещена в file_routes.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
