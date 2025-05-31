from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Path, Body
from fastapi.responses import JSONResponse, FileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid
import mimetypes
import secrets
import logging
from pathlib import Path as FilePath

from database import get_db
from auth import get_current_user
import models
import schemas
from storage import StorageManager

# Конфигурация
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
MAX_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024  # 5GB
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")

# Инициализация менеджера хранилища
storage_manager = StorageManager(UPLOAD_DIR)

# Настройка логгера
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Создаем роутер для файлового API
router = APIRouter(
    prefix="/api/files",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

# Генерация уникального токена доступа для файла
def generate_access_token() -> str:
    """Генерирует уникальный токен доступа для файла"""
    return secrets.token_urlsafe(32)

# Определение URL для доступа к файлу
def get_file_urls(file_id: str, access_token: Optional[str] = None, is_public: bool = False) -> dict:
    """Формирует URL для доступа к файлу"""
    private_url = f"{API_BASE_URL}/api/files/download/{file_id}"
    
    # Публичная ссылка формируется только для публичных файлов
    public_url = None
    if is_public:
        public_url = f"{API_BASE_URL}/api/files/public/{file_id}"
    
    # Если есть токен доступа, добавляем ссылку с токеном
    token_url = None
    if access_token:
        token_url = f"{API_BASE_URL}/api/files/shared/{access_token}"
    
    return {
        "private_url": private_url,
        "public_url": public_url,
        "token_url": token_url
    }

@router.get("/", response_model=List[schemas.FileInFolder])
async def list_files(
    folder: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список файлов пользователя, опционально фильтруя по папке
    """
    files = models.get_user_files(db, user_id=str(current_user.id), folder=folder)
    return files

@router.get("/folders", response_model=List[schemas.FolderInfo])
async def list_folders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список папок пользователя с количеством файлов и общим размером
    """
    # Получаем все файлы пользователя
    files = models.get_user_files(db, user_id=str(current_user.id))
    
    # Группируем файлы по папкам
    folders = {}
    for file in files:
        folder_name = file.folder or "Корневая директория"
        
        if folder_name not in folders:
            folders[folder_name] = {
                "name": folder_name,
                "file_count": 0,
                "total_size": 0
            }
        
        folders[folder_name]["file_count"] += 1
        folders[folder_name]["total_size"] += file.file_size
    
    return list(folders.values())

@router.get("/search", response_model=List[schemas.FileInFolder])
async def search_files(
    query: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Поиск файлов по имени, описанию или тегам
    """
    files = models.search_files(db, user_id=str(current_user.id), query=query)
    return files

@router.get("/public", response_model=List[schemas.FileInFolder])
async def list_public_files(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список публичных файлов пользователя
    """
    files = models.get_public_files(db, user_id=str(current_user.id))
    return files

@router.post("/upload", response_model=schemas.File)
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Загрузить новый файл
    """
    user_id = str(current_user.id)
    
    # Проверка размера хранилища пользователя
    current_usage = models.get_user_storage_usage(db, user_id)
    if current_usage + file.size > MAX_USER_STORAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Превышен лимит хранилища. Доступно: {MAX_USER_STORAGE_BYTES - current_usage} байт"
        )
    
    try:
        # Сохраняем файл в хранилище
        file_id, file_path, file_size = storage_manager.save_file(
            user_id=user_id,
            file_data=file.file,
            original_filename=file.filename,
            is_public=is_public,
            folder=folder
        )
        
        # Определяем MIME-тип файла
        mime_type = storage_manager.get_file_mime_type(file_path)
        
        # Генерируем токен доступа для файла
        access_token = generate_access_token() if is_public else None
        
        # Подготавливаем данные для создания файла в БД
        
        # Формируем URL для доступа к файлу до создания в базе
        urls = get_file_urls(
            file_id=file_id,
            access_token=access_token,
            is_public=is_public
        )
        
        # Создаем запись о файле в базе данных
        db_file = models.create_file(
            db=db,
            user_id=user_id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            folder=folder,
            description=description,
            tags=tags,
            is_public=is_public,
            access_token=access_token,
            private_url=urls["private_url"],
            public_url=urls["public_url"]
        )
        
        return db_file
    
    except Exception as e:
        logger.error(f"Ошибка загрузки файла: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")

@router.get("/{file_id}", response_model=schemas.File)
async def get_file_info(
    file_id: str = Path(..., description="ID файла"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить информацию о файле по его ID
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id) and not file.is_public:
        raise HTTPException(status_code=403, detail="Нет прав для просмотра этого файла")
    
    # Формируем URL для доступа к файлу
    urls = get_file_urls(
        file_id=file.id,
        access_token=file.access_token,
        is_public=file.is_public
    )
    
    # Добавляем URL к объекту файла перед возвратом
    file.private_url = urls["private_url"]
    file.public_url = urls["public_url"]
    
    # Увеличиваем счетчик просмотров
    models.increment_file_view_count(db, file_id=file_id)
    
    return file

@router.put("/{file_id}", response_model=schemas.File)
async def update_file(
    file_id: str = Path(..., description="ID файла"),
    file_update: schemas.FileUpdate = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновить информацию о файле
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Нет прав для изменения этого файла")
    
    # Проверяем, изменился ли статус публичного доступа
    old_is_public = file.is_public
    new_is_public = file_update.is_public if file_update.is_public is not None else old_is_public
    
    # Обновление токена доступа при изменении статуса публичного доступа
    access_token = None
    if not old_is_public and new_is_public:
        # Файл стал публичным, генерируем токен
        access_token = generate_access_token()
    elif old_is_public and not new_is_public:
        # Файл стал приватным, удаляем токен
        access_token = None
    
    # Обновляем файл в базе данных
    update_data = file_update.dict(exclude_unset=True)
    if access_token is not None:
        update_data["access_token"] = access_token
    
    updated_file = models.update_file(db, file_id=file_id, **update_data)
    
    # Если изменился статус публичного доступа, перемещаем файл
    if old_is_public != new_is_public:
        new_path = storage_manager.move_file(
            file_path=file.file_path,
            user_id=str(current_user.id),
            is_public=new_is_public
        )
        
        if new_path:
            models.update_file(db, file_id=file_id, file_path=new_path)
            updated_file.file_path = new_path
    
    # Формируем URL для доступа к файлу
    urls = get_file_urls(
        file_id=updated_file.id,
        access_token=updated_file.access_token,
        is_public=updated_file.is_public
    )
    
    # Добавляем URL к объекту файла перед возвратом
    updated_file.private_url = urls["private_url"]
    updated_file.public_url = urls["public_url"]
    
    return updated_file

@router.delete("/{file_id}", response_model=schemas.Message)
async def delete_file(
    file_id: str = Path(..., description="ID файла"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удалить файл
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Нет прав для удаления этого файла")
    
    # Сохраняем путь к файлу перед удалением из БД
    file_path = file.file_path
    
    # Удаляем запись о файле из базы данных
    delete_result = models.delete_file(db, file_id=file_id)
    
    if not delete_result:
        raise HTTPException(status_code=500, detail="Ошибка при удалении файла из базы данных")
    
    # Удаляем файл из хранилища
    storage_result = storage_manager.delete_file(file_path=file_path)
    
    if not storage_result:
        logger.warning(f"Файл {file_path} не найден в хранилище при попытке удаления")
    
    return {"message": "Файл успешно удален"}

@router.post("/{file_id}/share", response_model=schemas.FileAccessToken)
async def share_file(
    file_id: str = Path(..., description="ID файла"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создать токен для доступа к файлу по ссылке
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Нет прав для изменения этого файла")
    
    # Генерируем новый токен доступа
    access_token = generate_access_token()
    
    # Обновляем запись о файле
    updated_file = models.update_file(
        db, 
        file_id=file_id, 
        access_token=access_token,
        is_public=True  # При создании ссылки файл автоматически становится публичным
    )
    
    # Если файл был приватным, перемещаем его в публичное хранилище
    if not file.is_public:
        new_path = storage_manager.move_file(
            file_path=file.file_path,
            user_id=str(current_user.id),
            is_public=True
        )
        
        if new_path:
            models.update_file(db, file_id=file_id, file_path=new_path)
    
    # Формируем публичный URL с токеном
    public_url = f"{API_BASE_URL}/api/files/shared/{access_token}"
    
    return {
        "file_id": file_id,
        "access_token": access_token,
        "public_url": public_url
    }

@router.get("/download/{file_id}")
async def download_private_file(
    file_id: str = Path(..., description="ID файла"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Скачать приватный файл (требуется авторизация)
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id) and not file.is_public:
        raise HTTPException(status_code=403, detail="Нет прав для скачивания этого файла")
    
    # Проверяем существование файла
    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    
    # Увеличиваем счетчик скачиваний
    models.increment_file_download_count(db, file_id=file_id)
    
    # Проверяем и обновляем MIME-тип, если он не определен или некорректен
    mime_type = file.mime_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = storage_manager.get_file_mime_type(file.file_path)
        # Обновляем MIME-тип в базе данных
        models.update_file(db, file_id=file.id, mime_type=mime_type)
        
    return FileResponse(
        path=file.file_path,
        filename=file.filename,
        media_type=mime_type
    )

@router.get("/public/{file_id}")
async def download_public_file(
    file_id: str = Path(..., description="ID файла"),
    db: Session = Depends(get_db)
):
    """
    Скачать публичный файл (не требуется авторизация)
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file or not file.is_public:
        raise HTTPException(status_code=404, detail="Файл не найден или не является публичным")
    
    # Проверяем существование файла
    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    
    # Увеличиваем счетчик скачиваний
    models.increment_file_download_count(db, file_id=file_id)
    
    # Проверяем и обновляем MIME-тип, если он не определен или некорректен
    mime_type = file.mime_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = storage_manager.get_file_mime_type(file.file_path)
        # Обновляем MIME-тип в базе данных
        models.update_file(db, file_id=file.id, mime_type=mime_type)
        
    return FileResponse(
        path=file.file_path,
        filename=file.filename,
        media_type=mime_type
    )

@router.get("/shared/{access_token}")
async def download_shared_file(
    access_token: str = Path(..., description="Токен доступа к файлу"),
    db: Session = Depends(get_db)
):
    """
    Скачать файл по токену доступа (не требуется авторизация)
    """
    file = models.get_file_by_access_token(db, access_token=access_token)
    
    if not file or not file.is_public:
        raise HTTPException(status_code=404, detail="Файл не найден или ссылка недействительна")
    
    # Проверяем существование файла
    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    
    # Увеличиваем счетчик скачиваний
    models.increment_file_download_count(db, file_id=file.id)
    
    # Проверяем и обновляем MIME-тип, если он не определен или некорректен
    mime_type = file.mime_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = storage_manager.get_file_mime_type(file.file_path)
        # Обновляем MIME-тип в базе данных
        models.update_file(db, file_id=file.id, mime_type=mime_type)
        
    return FileResponse(
        path=file.file_path,
        filename=file.filename,
        media_type=mime_type
    )

@router.get("/preview/{file_id}")
async def preview_file(
    file_id: str = Path(..., description="ID файла"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Предпросмотр приватного файла (требуется авторизация)
    """
    file = models.get_file(db, file_id=file_id)
    
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Проверка прав доступа
    if file.user_id != str(current_user.id) and not file.is_public:
        raise HTTPException(status_code=403, detail="Нет прав для просмотра этого файла")
    
    # Проверяем существование файла
    if not os.path.exists(file.file_path):
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    
    # Увеличиваем счетчик просмотров
    models.increment_file_view_count(db, file_id=file_id)
    
    # Проверяем и обновляем MIME-тип, если он не определен или некорректен
    mime_type = file.mime_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = storage_manager.get_file_mime_type(file.file_path)
        # Обновляем MIME-тип в базе данных
        models.update_file(db, file_id=file_id, mime_type=mime_type)
        
    return FileResponse(
        path=file.file_path,
        media_type=mime_type
    )

@router.get("/stats/usage", response_model=schemas.StorageInfo)
async def get_storage_usage(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить информацию об использовании хранилища
    """
    used_storage = models.get_user_storage_usage(db, user_id=str(current_user.id))
    
    # Рассчитываем процент использования
    percentage = (used_storage / MAX_USER_STORAGE_BYTES) * 100
    
    return {
        "used": used_storage,
        "total": MAX_USER_STORAGE_BYTES,
        "percentage": round(percentage, 2)
    }

@router.get("/stats/popular", response_model=List[schemas.FileStats])
async def get_popular_files(
    limit: int = Query(5, description="Количество файлов для вывода"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить самые популярные файлы пользователя
    """
    # Получаем все файлы пользователя
    files = models.get_user_files(db, user_id=str(current_user.id))
    
    # Сортируем по сумме просмотров и скачиваний
    sorted_files = sorted(
        files, 
        key=lambda x: (x.view_count + x.download_count), 
        reverse=True
    )[:limit]
    
    # Формируем список статистики
    stats = []
    for file in sorted_files:
        stats.append({
            "id": file.id,
            "filename": file.filename,
            "view_count": file.view_count,
            "download_count": file.download_count,
            "last_accessed": file.last_accessed
        })
    
    return stats
