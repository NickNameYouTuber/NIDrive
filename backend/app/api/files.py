from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from pydantic import BaseModel
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
from typing import Optional, List
import shutil

from ..models.schemas import FileCreate, FileResponse, FileUpdate
from ..models.user import User
from ..models.file import File as FileModel
from ..core.database import get_db
from ..core.auth import get_current_user
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
        public_url=public_url
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
    current_user: Optional[User] = None,
):
    # Пытаемся получить пользователя из токена в параметрах, если не авторизован
    user = current_user
    if not user and token:
        try:
            from ..core.auth import verify_token
            payload = verify_token(token)
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.telegram_id == user_id).first()
        except Exception:
            # Если токен недействителен, продолжаем без аутентификации
            pass
    """
    Download file content. Public files can be downloaded without authentication.
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if file is public or owned by user
    is_owner = user and file.owner_id == user.telegram_id
    if not file.is_public and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    
    # Get file content
    file_path = file.storage_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File content not found")
    
    return FileResponse(
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

class VisibilityUpdate(BaseModel):
    is_public: bool

@router.patch("/{file_id}/visibility", response_model=FileResponse)
async def change_file_visibility(
    file_id: str,
    visibility: VisibilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle a file between public and private visibility
    """
    file = get_file_by_id(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Verify ownership
    if not is_owner_of_file(db, file_id, current_user.telegram_id):
        raise HTTPException(status_code=403, detail="Not authorized to change this file's visibility")
    
    updated_file = toggle_file_visibility(db, file_id, visibility.is_public, settings.PUBLIC_URL)
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
