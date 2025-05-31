"""
NIDrive File API Routes - эндпоинты для работы с новой системой файлового хранилища
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Optional
from sqlalchemy.orm import Session
import os
import io
import uuid

# Удалена зависимость от get_db, так как она не используется в новой системе хранилища файлов
from database import SessionLocal
from auth import get_current_user
from storage import StorageService, FileMetadata, StorageInfo, InMemoryStorageService
import models

# Добавляем зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Создаем роутер для файловых эндпоинтов
router = APIRouter()

# Получаем URI для MongoDB из переменных окружения
# Используем mongodb вместо localhost для работы в Docker
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/")
MONGO_DB = os.getenv("MONGO_DB", "nidrive")
MAX_USER_STORAGE = int(os.getenv("MAX_USER_STORAGE", 5 * 1024 * 1024 * 1024))  # 5GB по умолчанию

# Для отладки
print(f"MongoDB Connection: URI={MONGO_URI}, DB={MONGO_DB}")

# Создаем сервис хранилища
try:
    storage = StorageService(
        mongo_uri=MONGO_URI,
        db_name=MONGO_DB,
        max_user_storage=MAX_USER_STORAGE
    )
    # Проверяем подключение к MongoDB
    storage.check_connection()
    print("MongoDB connection established successfully!")
except Exception as e:
    print(f"ERROR: Failed to connect to MongoDB: {str(e)}")
    # Фаллбэк на временное решение без MongoDB
    from storage import InMemoryStorageService
    storage = InMemoryStorageService(max_user_storage=MAX_USER_STORAGE)
    print("Using in-memory storage as fallback due to MongoDB connection failure")

def get_storage():
    """Зависимость для получения экземпляра хранилища"""
    try:
        yield storage
    finally:
        pass  # Соединение закрывается при завершении работы приложения

@router.get("/files", response_model=List[FileMetadata], tags=["files"])
async def list_files(
    folder: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Получить список файлов текущего пользователя
    
    Можно фильтровать файлы по папке
    """
    return storage_service.list_user_files(user_id=str(current_user.id), folder=folder)

@router.get("/files/folders", response_model=List[str], tags=["files"])
async def list_folders(
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """Получить список уникальных папок пользователя"""
    return storage_service.get_folders(user_id=str(current_user.id))

# Alias для /storage/usage
@router.get("/storage-info", response_model=StorageInfo, tags=["files"])
async def get_storage_info_alias(
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """Получить информацию об использовании хранилища (алиас для фронтенда)"""
    return storage_service.get_storage_info(user_id=str(current_user.id))

@router.post("/files/upload", response_model=FileMetadata, tags=["files"])
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Загрузить файл в хранилище
    
    - **file**: Файл для загрузки (обязательно)
    - **folder**: Папка для хранения (опционально)
    - **is_public**: Флаг публичного доступа (по умолчанию False)
    """
    return await storage_service.save_file(
        file=file,
        user_id=str(current_user.id),
        folder=folder,
        is_public=is_public
    )

@router.get("/files/{file_id}", tags=["files"])
async def get_file(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Получить файл по его ID (требует авторизации)
    
    Только владелец может получить доступ к приватному файлу
    """
    file_obj, metadata = storage_service.get_file(
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    return StreamingResponse(
        io.BytesIO(file_obj.read()),
        media_type=metadata.content_type,
        headers={"Content-Disposition": f"attachment; filename={metadata.filename}"}
    )

@router.get("/files/{file_id}/info", response_model=FileMetadata, tags=["files"])
async def get_file_info(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """Получить информацию о файле"""
    _, metadata = storage_service.get_file(
        file_id=file_id,
        user_id=str(current_user.id)
    )
    return metadata

@router.get("/public/{file_id}", tags=["files"])
async def get_public_file(
    file_id: str,
    storage_service: StorageService = Depends(get_storage)
):
    """
    Получить публичный файл по его ID (не требует авторизации)
    
    Доступно только для файлов с флагом is_public=True
    """
    try:
        file_obj, metadata = storage_service.get_file(
            file_id=file_id,
            # Не передаем user_id, чтобы проверка происходила только по is_public
        )
        
        if not metadata.is_public:
            raise HTTPException(status_code=404, detail="Файл не найден или не является публичным")
        
        return StreamingResponse(
            io.BytesIO(file_obj.read()),
            media_type=metadata.content_type,
            headers={"Content-Disposition": f"attachment; filename={metadata.filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Не удалось получить файл: {str(e)}")

@router.get("/files/{file_id}/token", tags=["files"])
async def generate_access_token(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Сгенерировать токен доступа для приватного файла
    
    Токен позволяет получить доступ к приватному файлу без авторизации
    """
    # Получаем метаданные файла для проверки прав доступа
    _, metadata = storage_service.get_file(
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    # Получаем или генерируем токен доступа
    token = metadata.access_token or str(uuid.uuid4())
    
    # Если токена нет, обновляем файл с новым токеном
    if not metadata.access_token:
        storage_service.files_metadata.update_one(
            {"id": file_id},
            {"$set": {"access_token": token}}
        )
    
    # Формируем URL для доступа к файлу по токену
    file_url = f"/api/files/access/{file_id}?token={token}"
    
    return {"access_token": token, "file_url": file_url}

@router.get("/api/files/access/{file_id}", tags=["files"])
async def access_file_with_token(
    file_id: str,
    token: str = Query(...),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Получить доступ к файлу по токену
    
    Позволяет получить доступ к приватному файлу без авторизации, используя токен
    """
    try:
        file_obj, metadata = storage_service.get_file(
            file_id=file_id,
            access_token=token
        )
        
        return StreamingResponse(
            io.BytesIO(file_obj.read()),
            media_type=metadata.content_type,
            headers={"Content-Disposition": f"attachment; filename={metadata.filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Не удалось получить файл: {str(e)}")

@router.delete("/files/{file_id}", tags=["files"])
async def delete_file(
    file_id: str,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """Удалить файл"""
    deleted = storage_service.delete_file(
        file_id=file_id,
        user_id=str(current_user.id)
    )
    
    return {"success": deleted, "message": "Файл успешно удален"}

@router.put("/files/{file_id}/privacy", response_model=FileMetadata, tags=["files"])
async def update_file_privacy(
    file_id: str,
    is_public: bool,
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """
    Изменить статус публичности файла
    
    - **is_public**: True для публичного доступа, False для приватного
    """
    return storage_service.set_file_privacy(
        file_id=file_id,
        user_id=str(current_user.id),
        is_public=is_public
    )

@router.get("/storage/info", response_model=StorageInfo, tags=["storage"])
async def get_storage_info(
    current_user: models.User = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage)
):
    """Получить информацию об использовании хранилища"""
    return storage_service.get_user_storage_info(user_id=str(current_user.id))
