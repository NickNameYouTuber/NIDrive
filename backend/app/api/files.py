from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
from typing import Optional, List, Dict
import shutil

from ..models.schemas import FileCreate, FileResponse, FileUpdate
from ..models.user import User
from ..models.file import File as FileModel
from ..core.database import get_db
from ..core.auth import get_current_user, get_current_user_optional
from ..core.config import settings
from ..services.file_service import (
    create_file, get_files_by_owner, get_file_by_id, 
    delete_file, update_file, get_file_content, is_owner_of_file,
    toggle_file_visibility
)

router = APIRouter(prefix="/api/v1/files")

@router.post("", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Преобразуем folder_id в целое число или None для корневой папки
    processed_folder_id = None
    if folder_id:
        if folder_id.strip() == "":
            processed_folder_id = None  # Корневая папка
        else:
            try:
                processed_folder_id = int(folder_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="folder_id must be a valid integer or empty for root folder"
                )
    """
    Upload a new file to user's storage
    """
    # Check file size
    # Read file into memory - this could be optimized for large files
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)  # Convert bytes to MB
    
    # Check file size against limit
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB"
        )
    
    # Check user quota
    if current_user.used_space + file_size_mb > current_user.quota:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Insufficient storage space. Available: {current_user.quota - current_user.used_space:.2f} MB"
        )
    
    # Generate unique file storage path
    storage_dir = os.path.join(settings.UPLOAD_DIR, "private_files" if not is_public else "public_files")
    os.makedirs(storage_dir, exist_ok=True)
    
    file_uuid = str(uuid.uuid4())
    storage_filename = f"{current_user.telegram_id}_{file_uuid}_{file.filename}"
    storage_path = os.path.join(storage_dir, storage_filename)
    
    # Save file to storage
    with open(storage_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Generate public URL if file is public
    public_url = None
    if is_public:
        public_url = f"{settings.PUBLIC_URL}/public/{storage_filename}"
    
    # Generate UUID for the file ID
    file_id = str(uuid.uuid4())
    
    # Create file record in database
    file_data = FileCreate(
        filename=file.filename,
        folder_id=processed_folder_id,
        is_public=is_public
    )
    return create_file(
        db=db, 
        file=file_data, 
        owner_id=current_user.telegram_id, 
        storage_path=storage_path,
        size_mb=file_size_mb,
        mime_type=file.content_type,
        public_url=public_url,
        file_id=file_id
    )

@router.get("", response_model=List[FileResponse])
async def list_files(
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List files owned by the current user, optionally filtered by folder
    """
    return get_files_by_owner(db, current_user.telegram_id, folder_id)

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific file's metadata
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if file.owner_id != current_user.telegram_id and not file.is_public:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
    
    return file

@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Download file content. Supports authentication via token cookie or query parameter.
    """
    # Если пользователь не аутентифицирован через cookie, попробуем через URL параметр
    authenticated_user = current_user
    if not authenticated_user and token:
        try:
            # Проверяем токен из URL параметра
            payload = verify_token(token)
            user_id = payload.get("sub")
            if user_id:
                authenticated_user = db.query(User).filter(User.telegram_id == user_id).first()
        except Exception:
            pass  # Если токен недействителен, просто продолжаем без авторизации
    
    # Получаем файл
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем доступ
    if file.is_public:
        # Публичные файлы доступны всем
        pass
    elif authenticated_user and file.owner_id == authenticated_user.telegram_id:
        # Владельцу разрешено скачивать собственные файлы
        pass
    else:
        # В остальных случаях отказываем в доступе
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    
    # Get file content
    file_path = file.storage_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File content not found")
    
    return FileResponse(
        path=file_path,
        filename=file.filename,
        media_type=file.mime_type if file.mime_type else "application/octet-stream"
    )

@router.get("/{file_id}/public-download")
async def download_public_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Download public file content without authentication.
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if the file is public
    if not file.is_public:
        raise HTTPException(status_code=403, detail="This file is not public")
    
    # Get file content
    file_path = file.storage_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File content not found")
    
    return FileResponse(
        path=file_path,
        filename=file.filename,
        media_type=file.mime_type if file.mime_type else "application/octet-stream"
    )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file (mark as deleted)
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Verify ownership
    if not is_owner_of_file(db, file_id, current_user.telegram_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    delete_file(db, file_id, current_user.telegram_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/{file_id}/visibility", response_model=FileResponse)
async def change_file_visibility(
    file_id: str,
    visibility_data: Dict[str, bool] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle a file's visibility between public and private
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user is the owner
    if file.owner_id != current_user.telegram_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this file")
    
    # Toggle visibility
    is_public = visibility_data.get("is_public")
    if is_public is None:
        raise HTTPException(status_code=400, detail="is_public field is required")
    
    public_url_base = settings.PUBLIC_URL
    updated_file = toggle_file_visibility(db, file_id, is_public, public_url_base)
    
    return updated_file

@router.put("/{file_id}", response_model=FileResponse)
async def update_file_metadata(
    file_id: str,
    file_update: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update file metadata (filename, folder, visibility)
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Verify ownership
    if not is_owner_of_file(db, file_id, current_user.telegram_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this file")
    
    updated_file = update_file(db, file_id, file_update, settings.PUBLIC_URL)
    return updated_file

@router.get("/{file_id}/public-url")
async def get_public_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the public URL or authenticated URL for a file
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user is the owner
    if file.owner_id != current_user.telegram_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this file's URL")
    
    # Генерируем URL в зависимости от типа файла
    if file.is_public:
        # Для публичных файлов просто даем публичную ссылку
        file_url = f"{settings.PUBLIC_URL}/api/v1/files/{file_id}/public-download"
    else:
        # Для приватных файлов генерируем временный токен доступа владельца
        token_data = {"sub": current_user.telegram_id}
        token = create_access_token(token_data)
        file_url = f"{settings.PUBLIC_URL}/api/v1/files/{file_id}/download?token={token}"
    
    return {"file_url": file_url}
