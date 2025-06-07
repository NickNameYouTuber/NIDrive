from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..models.schemas import FileResponse, FolderResponse
from ..models.user import User
from ..core.database import get_db
from ..core.auth import get_current_user
from ..services.file_service import get_recent_files, search_files
from ..services.folder_service import get_recent_folders

router = APIRouter(prefix="/api/v1")

@router.get("/files/recent", response_model=List[FileResponse])
async def get_user_recent_files(
    limit: int = Query(10, description="Limit the number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent files for the current user
    """
    return get_recent_files(db, current_user.id, limit)

@router.get("/folders/recent", response_model=List[FolderResponse])
async def get_user_recent_folders(
    limit: int = Query(5, description="Limit the number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent folders for the current user
    """
    return get_recent_folders(db, current_user.id, limit)

@router.get("/files/search", response_model=List[FileResponse])
async def search_user_files(
    query: str = Query(..., description="Search query"),
    file_type: Optional[str] = Query(None, description="Filter by file type (image, document, video, audio, archive)"),
    date_from: Optional[str] = Query(None, description="Filter by date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter by date to (YYYY-MM-DD)"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for files by name with optional filters
    """
    # Validate dates if provided
    from_date = None
    to_date = None
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d").date().isoformat()
        except ValueError:
            from_date = None
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d").date().isoformat()
        except ValueError:
            to_date = None
    
    return search_files(
        db, 
        current_user.id, 
        query, 
        file_type, 
        from_date, 
        to_date, 
        is_public
    )
