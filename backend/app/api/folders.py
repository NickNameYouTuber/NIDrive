from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.schemas import FolderCreate, FolderResponse, FolderUpdate, FolderTree
from ..models.user import User
from ..core.database import get_db
from ..core.auth import get_current_user
from ..services.folder_service import (
    create_folder, get_folders_by_owner, get_folder_by_id, 
    update_folder, delete_folder, is_owner_of_folder,
    get_folder_tree
)

router = APIRouter(prefix="/api/v1/folders")

@router.post("", response_model=FolderResponse)
async def create_new_folder(
    folder: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new folder
    """
    # If parent_id is provided, verify it exists and belongs to the user
    if folder.parent_id:
        parent_folder = get_folder_by_id(db, folder.parent_id)
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")
            
        if parent_folder.owner_id != current_user.telegram_id:
            raise HTTPException(status_code=403, detail="Not authorized to use this parent folder")
    
    return create_folder(db, folder, current_user.telegram_id)

@router.get("", response_model=List[FolderResponse])
async def list_folders(
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List folders owned by the current user, optionally filtered by parent folder
    """
    return get_folders_by_owner(db, current_user.telegram_id, parent_id)

@router.get("/tree", response_model=List[FolderTree])
async def get_folder_structure(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the complete folder tree structure for the user
    """
    return get_folder_tree(db, current_user.telegram_id)

@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific folder's metadata
    """
    folder = get_folder_by_id(db, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    if folder.owner_id != current_user.telegram_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this folder")
    
    return folder

@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder_info(
    folder_id: int,
    folder_update: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update folder metadata (name, parent folder)
    """
    folder = get_folder_by_id(db, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Verify ownership
    if not is_owner_of_folder(db, folder_id, current_user.telegram_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this folder")
    
    # If changing parent, verify the new parent exists and belongs to the user
    if folder_update.parent_id and folder_update.parent_id != folder.parent_id:
        # Check for circular dependency (cannot set a folder as its own descendant)
        if folder_id == folder_update.parent_id:
            raise HTTPException(status_code=400, detail="Cannot set a folder as its own parent")
        
        parent_folder = get_folder_by_id(db, folder_update.parent_id)
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")
            
        if parent_folder.owner_id != current_user.telegram_id:
            raise HTTPException(status_code=403, detail="Not authorized to use this parent folder")
    
    return update_folder(db, folder_id, folder_update)

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a folder (mark as deleted)
    """
    folder = get_folder_by_id(db, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Verify ownership
    if not is_owner_of_folder(db, folder_id, current_user.telegram_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this folder")
    
    delete_folder(db, folder_id, current_user.telegram_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
