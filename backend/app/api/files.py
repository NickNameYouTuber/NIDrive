from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response, Body
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import shutil

from ..models.schemas import FileCreate, FileResponse as FileSchemaResponse, FileUpdate
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

@router.post("", response_model=FileSchemaResponse)
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

@router.get("", response_model=List[FileSchemaResponse])
async def list_files(
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List files owned by the current user, optionally filtered by folder
    """
    return get_files_by_owner(db, current_user.telegram_id, folder_id)

@router.get("/{file_id}", response_model=FileSchemaResponse)
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

# Основной endpoint для скачивания файлов - работает и с публичными, и с приватными файлами
@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Download file content with authentication. All files require authentication.
    Private files also require owner permissions.
    
    This endpoint is designed to be used with client-side JavaScript for handling downloads:
    
    ```javascript
    // Download example
    let headers = new Headers();
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    
    fetch(fileUrl, { headers })
        .then(response => {
            if (!response.ok) throw new Error('Download failed');
            return response.blob();
        })
        .then(blob => {
            let objectUrl = window.URL.createObjectURL(blob);
            let anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            window.URL.revokeObjectURL(objectUrl);
            document.body.removeChild(anchor);
        });
    ```
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Для всех файлов требуем аутентификацию
    if current_user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    # Для приватных файлов требуем, чтобы текущий пользователь был владельцем
    if not file.is_public and file.owner_id != current_user.telegram_id:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    
    file_path = os.path.join(settings.UPLOAD_DIR, file.storage_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FastAPIFileResponse(
        path=file_path,
        filename=file.filename,
        media_type=file.mime_type or "application/octet-stream"
    )

# Новый маршрут для публичных файлов (не требует аутентификации)
@router.get("/public/{file_id}/download")
async def download_public_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Download public file content. Only public files can be accessed with this endpoint.
    No authentication required.
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем, что файл публичный
    if not file.is_public:
        raise HTTPException(status_code=403, detail="This file is not public")
    
    file_path = os.path.join(settings.UPLOAD_DIR, file.storage_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FastAPIFileResponse(
        path=file_path,
        filename=file.filename,
        media_type=file.mime_type or "application/octet-stream"
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

@router.patch("/{file_id}/visibility", response_model=FileSchemaResponse)
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

@router.put("/{file_id}", response_model=FileSchemaResponse)
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
async def get_file_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a shareable URL for a file (works for both public and private files)
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user is the owner
    if file.owner_id != current_user.telegram_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this file's URL")
    
    # Создаем публичный URL на основе настроек
    # Для публичных файлов используем маршрут /public/, для приватных - обычный
    if file.is_public:
        download_url = f"{settings.PUBLIC_URL}{settings.API_V1_STR}/files/public/{file_id}/download"
    else:
        download_url = f"{settings.PUBLIC_URL}{settings.API_V1_STR}/files/{file_id}/download"
    
    # Дополнительная информация для фронтенда
    response = {
        "file_url": download_url,
        "filename": file.filename,
        "is_public": file.is_public,
        "js_download_code": """
// Используйте этот код для скачивания файла без открытия нового окна
function downloadFile(url, filename, token) {
  let headers = new Headers();
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  fetch(url, { headers })
    .then(response => {
      if (!response.ok) throw new Error('Download failed');
      return response.blob();
    })
    .then(blob => {
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(anchor);
    })
    .catch(error => console.error('Download error:', error));
}
"""
    }
    
    # Для приватных файлов предупреждаем, что нужен токен
    if not file.is_public:
        response["requires_auth"] = True
        response["auth_note"] = "Для скачивания необходима аутентификация"
    
    return response
