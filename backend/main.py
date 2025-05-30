from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Request
import logging
import datetime
from starlette.responses import RedirectResponse

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

# Configure file storage
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
MAX_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024  # 5GB

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory for static file serving
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

# Configure public access route (for public files)
@app.get("/public/{public_url_id}/{filename}")
def get_public_file(public_url_id: str, filename: str, db: Session = Depends(get_db)):
    """Access a public file via its public URL"""
    public_url = f"/public/{public_url_id}/{filename}"
    file = models.get_file_by_public_url(db, public_url=public_url)
    
    if not file or not file.is_public:
        raise HTTPException(status_code=404, detail="File not found or not public")
    
    # Redirect to the actual file location
    return RedirectResponse(url=file.file_url)

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
        if existing_code.expires_at < datetime.datetime.utcnow():
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
    if not db_code or db_code.expires_at < datetime.datetime.utcnow():
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
        
        return {
            "authenticated": True,
            "user_id": str(user.id),  # Явно преобразуем UUID в строку
            "access_token": access_token,
            "token_type": "bearer"
        }
    
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
    
    if db_code.expires_at < datetime.datetime.utcnow():
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
    # Check current storage usage
    current_usage = models.get_user_storage_usage(db, user_id=current_user.id)
    file_size = 0
    
    # Get file size
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)  # Reset file pointer to beginning
    
    # Check if this would exceed the user's storage limit
    if current_usage + file_size > MAX_USER_STORAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Upload would exceed your storage limit of {MAX_USER_STORAGE_BYTES/(1024*1024*1024)}GB"
        )
    
    # Generate a unique filename to avoid conflicts
    original_filename = file.filename
    file_extension = original_filename.split(".")[-1] if "." in original_filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else f"{uuid.uuid4()}"
    
    # Create user directory if it doesn't exist
    user_dir = Path(UPLOAD_DIR) / str(current_user.id)
    user_dir.mkdir(exist_ok=True)
    
    # Create folder if specified
    if folder:
        folder_path = user_dir / folder
        folder_path.mkdir(exist_ok=True)
        file_path = folder_path / unique_filename
    else:
        file_path = user_dir / unique_filename
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create file record in database
    file_url = f"/files/{current_user.id}/{folder + '/' if folder else ''}{unique_filename}"
    
    # Generate a public URL if the file is public
    public_url = None
    if is_public:
        public_url = f"/public/{uuid.uuid4()}/{original_filename}"
    
    db_file = models.create_file(
        db=db,
        user_id=current_user.id,
        filename=original_filename,
        file_path=str(file_path),
        file_url=file_url,
        public_url=public_url,
        file_size=file_size,
        folder=folder,
        is_public=is_public
    )
    
    return db_file

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

# Два маршрута для переключения приватности: PUT и POST для совместимости с Nginx
@app.put("/files/{file_id}/toggle-privacy", response_model=schemas.File)
@app.post("/files/{file_id}/toggle-privacy", response_model=schemas.File)  # Дублируем с POST для совместимости
def toggle_file_privacy(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a file's public/private status"""
    file = models.get_file(db, file_id=file_id)
    if not file or file.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Toggle status
    new_status = not file.is_public
    
    # If becoming public, generate a public URL
    public_url = None
    if new_status:
        public_url = f"/public/{uuid.uuid4()}/{file.filename}"
    
    updated_file = models.set_file_public_status(
        db=db, 
        file_id=file_id, 
        is_public=new_status,
        public_url=public_url
    )
    
    return updated_file

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
