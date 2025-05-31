from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Request
import logging
from datetime import datetime, timedelta
from starlette.responses import RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from typing import List, Optional
import uuid
import secrets
from pathlib import Path

from database import SessionLocal, engine, Base
import models
import schemas
import file_api
import health_check
from auth import get_current_user, create_access_token, verify_telegram_auth
from storage import StorageManager

# Настройка логгера
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NIDriveBot API", 
    description="File storage backend service",
    # Включаем полные сообщения об ошибках в продакшене для отладки
    debug=True,
)

# Configure CORS
# Обновленные настройки CORS с детальными разрешениями
# Разрешаем все ориджины для быстрого тестирования
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
from fastapi.responses import JSONResponse
import time
import traceback
import sys

# Мидлварь для логирования запросов
class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Логируем входящий запрос
        logger.info(f"Request: {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
        
        # Отлавливаем исключения во время обработки
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Exception during request processing: {str(e)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "message": str(e)}
            )
        
        # Логируем информацию об ответе
        process_time = time.time() - start_time
        logger.info(f"Response: {request.method} {request.url.path} - Status {response.status_code} - Time {process_time:.3f}s")
        
        return response

# Добавляем мидлварь для логирования
app.add_middleware(RequestLoggerMiddleware)

# Добавляем сжатие gzip для больших ответов
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все ориджины для тестирования
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
    expose_headers=["*"],
    max_age=86400,  # Кэширование на 24 часа
)

# Глобальные обработчики исключений
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    logger.error(f"HTTP Exception: {exc.detail} (status code: {exc.status_code})")
    return await http_exception_handler(request, exc)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation Error: {str(exc)}")
    return await request_validation_exception_handler(request, exc)

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled Exception: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_tb(exc.__traceback__) if app.debug else None
        }
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

# Configure file storage
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
MAX_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024  # 5GB

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Создаем отдельные директории для приватных и публичных файлов
PRIVATE_DIR = os.path.join(UPLOAD_DIR, "private")
PUBLIC_DIR = os.path.join(UPLOAD_DIR, "public")
os.makedirs(PRIVATE_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

# Добавляем API маршруты
app.include_router(file_api.router)
app.include_router(health_check.router)

# Старые эндпоинты для работы с файлами удалены.
# Теперь используется новое файловое API с более правильным разделением на приватные/публичные файлы.

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Обработчик для OPTIONS запросов (CORS preflight)"""
    return {"allowed": True}

@app.get("/")
def read_root():
    return {"message": "Welcome to NIDriveBot API", "status": "online", "version": "1.0.0"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return current_user

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
            # Create user directory
            user_dir = Path(UPLOAD_DIR) / str(user.id)
            user_dir.mkdir(exist_ok=True)
        
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
    return current_user

@app.get("/files", response_model=List[schemas.File])
def list_files(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files for the current user"""
    return models.get_user_files(db, user_id=current_user.id)

@app.get("/files/{file_id}", response_model=schemas.File)
def get_file_info(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information"""
    file = models.get_file(db, file_id=file_id)
    if not file or file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@app.post("/api/files/upload", response_model=schemas.File)
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new file"""
    # Определяем базовую директорию в зависимости от публичности файла
    base_dir = PUBLIC_DIR if is_public else PRIVATE_DIR
    
    # Создаем директорию пользователя
    user_dir = Path(base_dir) / str(current_user.id)
    user_dir.mkdir(exist_ok=True)
    
    # Создаем папку, если она указана
    if folder:
        folder_path = user_dir / folder
        folder_path.mkdir(exist_ok=True)
        save_path = folder_path / file.filename
    else:
        save_path = user_dir / file.filename
    
    # Check storage usage
    current_usage = models.get_user_storage_usage(db, user_id=current_user.id)
    content = await file.read()
    file_size = len(content)
    
    # Check if file size exceeds limit
    if current_usage + file_size > MAX_USER_STORAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Storage limit reached. Current usage: {current_usage} bytes. File size: {file_size} bytes. Maximum: {MAX_USER_STORAGE_BYTES} bytes."
        )
    
    # Save file to disk
    try:
        with open(save_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file"
        )
    finally:
        file.file.close()
    
    # Создаем файловый ID
    file_id = str(uuid.uuid4())
    
    # Создаем URL для файла в зависимости от типа (публичный/приватный)
    if is_public:
        # Публичный файл - доступен через /public/{file_id}
        file_url = f"/public/{file_id}"
        public_url = file_url  # Для публичных файлов URL совпадает
    else:
        # Приватный файл - доступен через /files/{file_id}
        file_url = f"/files/{file_id}"
        public_url = None
    
    # Save file info to database
    try:
        db_file = models.create_file(
            db=db, 
            user_id=current_user.id,
            filename=file.filename,
            file_path=str(save_path),
            file_url=file_url,
            file_size=file_size,
            folder=folder,
            is_public=is_public,
            public_url=public_url
        )
        # Задаем ID файла
        db_file.id = file_id
        db.commit()
        db.refresh(db_file)
        
        return db_file
    except Exception as e:
        # Clean up file if database operation fails
        if save_path.exists():
            save_path.unlink()
        logger.error(f"Error creating file record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create file record"
        )


# Внутренняя функция для переключения приватности
def toggle_privacy_internal(file_id: str, current_user: models.User, db: Session):
    # Получаем файл из БД
    file = models.get_file(db, file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа
    if file.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied - you don't have permission to modify this file")
    
    # Переключаем статус приватности
    new_status = not file.is_public
    
    # Обновляем URL и публичную ссылку
    if new_status:
        # Файл стал публичным
        file.file_url = f"/public/{file_id}"
        file.public_url = file.file_url
    else:
        # Файл стал приватным
        file.file_url = f"/files/{file_id}"
        file.public_url = None
    
    # Обновляем статус в БД
    file.is_public = new_status
    db.commit()
    
    return file

@app.delete("/files/{file_id}", response_model=schemas.Message)
def delete_file(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    file = models.get_file(db, file_id=file_id)
    if not file or file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file from filesystem
    try:
        os.remove(file.file_path)
    except Exception as e:
        # File might not exist, we still want to remove from DB
        print(f"Error deleting file: {e}")
    
    # Delete file from database
    models.delete_file(db, file_id=file_id)
    
    return {"message": "File deleted successfully"}

# Маршруты для переключения приватности файлов
@app.put("/files/{file_id}/toggle-privacy", response_model=schemas.File)
@app.post("/files/{file_id}/toggle-privacy", response_model=schemas.File)
def toggle_file_privacy(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a file's public/private status"""
    return toggle_privacy_internal(file_id, current_user, db)

# Дополнительный маршрут, который гарантированно не будет конфликтовать с настройками Nginx
@app.post("/api/privacy/toggle/{file_id}", response_model=schemas.File)
def toggle_file_privacy_alternative(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Alternative route to toggle a file's public/private status"""
    return toggle_privacy_internal(file_id, current_user, db)

@app.get("/storage/usage", response_model=schemas.StorageInfo)
def get_storage_usage(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get storage usage information"""
    try:
        logger.info(f"Getting storage usage for user {current_user.id}")
        usage = models.get_user_storage_usage(db, user_id=current_user.id)
        
        response = {
            "used": usage,
            "total": MAX_USER_STORAGE_BYTES,
            "percentage": (usage / MAX_USER_STORAGE_BYTES) * 100 if MAX_USER_STORAGE_BYTES > 0 else 0
        }
        
        logger.info(f"Storage usage response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error getting storage usage: {str(e)}")
        # Вернём заглушку вместо ошибки, чтобы интерфейс не ломался
        return {
            "used": 0,
            "total": MAX_USER_STORAGE_BYTES,
            "percentage": 0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
