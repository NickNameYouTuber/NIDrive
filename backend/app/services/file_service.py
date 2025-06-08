import os
import shutil
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..models.file import File
from ..models.schemas import FileCreate, FileUpdate
from ..core.config import settings
from .user_service import update_user_space_usage

def create_file(
    db: Session, 
    file: FileCreate, 
    owner_id: str, 
    storage_path: str,
    size_mb: float,
    mime_type: str = None,
    public_url: str = None,
    file_id: str = None
):
    """Create a new file record in the database"""
    db_file = File(
        filename=file.filename,
        storage_path=storage_path,
        owner_id=owner_id,
        folder_id=file.folder_id,
        size_mb=size_mb,
        mime_type=mime_type,
        is_public=file.is_public,
        public_url=public_url,
        id=file_id if file_id else None
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Update user's space usage
    update_user_space_usage(db, owner_id, size_mb)
    
    return db_file

def get_files_by_owner(db: Session, owner_id: str, folder_id: int = None):
    """Get all active files for a user, optionally filtered by folder"""
    query = db.query(File).filter(
        File.owner_id == owner_id,
        File.is_deleted == False
    )
    
    if folder_id is not None:
        query = query.filter(File.folder_id == folder_id)
    
    return query.all()

def get_file_by_id(db: Session, file_id: int):
    """Get a file by its ID"""
    return db.query(File).filter(File.id == file_id).first()

def is_owner_of_file(db: Session, file_id: int, owner_id: str):
    """Check if a user is the owner of a file"""
    file = get_file_by_id(db, file_id)
    return file and file.owner_id == owner_id

def update_file(db: Session, file_id: int, file_update: FileUpdate, public_url_base: str):
    """Update file metadata"""
    db_file = get_file_by_id(db, file_id)
    if not db_file:
        return None
        
    # Update allowed fields
    update_data = file_update.dict(exclude_unset=True, exclude_none=True)
    
    # If is_public flag is changing, update the public_url
    if 'is_public' in update_data and update_data['is_public'] != db_file.is_public:
        # Extract filename from storage path
        filename = os.path.basename(db_file.storage_path)
        
        # Update public URL based on visibility
        if update_data['is_public']:
            # Make the file public
            if os.path.exists(db_file.storage_path):
                # Move file to public directory if it's not already there
                if 'private_files' in db_file.storage_path:
                    new_path = db_file.storage_path.replace('private_files', 'public_files')
                    os.makedirs(os.path.dirname(new_path), exist_ok=True)
                    shutil.copy2(db_file.storage_path, new_path)
                    os.remove(db_file.storage_path)
                    db_file.storage_path = new_path
                
                # Set public URL
                db_file.public_url = f"{public_url_base}/public/{filename}"
        else:
            # Make the file private
            if os.path.exists(db_file.storage_path):
                # Move file to private directory if it's not already there
                if 'public_files' in db_file.storage_path:
                    new_path = db_file.storage_path.replace('public_files', 'private_files')
                    os.makedirs(os.path.dirname(new_path), exist_ok=True)
                    shutil.copy2(db_file.storage_path, new_path)
                    os.remove(db_file.storage_path)
                    db_file.storage_path = new_path
            
            # Remove public URL
            db_file.public_url = None
    
    # Update other fields
    for key, value in update_data.items():
        setattr(db_file, key, value)
    
    db.commit()
    db.refresh(db_file)
    return db_file

def delete_file(db: Session, file_id: int, owner_id: str):
    """Mark a file as deleted and update user's space usage"""
    db_file = get_file_by_id(db, file_id)
    if db_file and db_file.owner_id == owner_id and not db_file.is_deleted:
        # Mark as deleted in database
        db_file.is_deleted = True
        db.commit()
        
        # Update user's space usage (subtract the file size)
        update_user_space_usage(db, owner_id, -db_file.size_mb)
        
        # Optionally delete the physical file
        # if os.path.exists(db_file.storage_path):
        #    os.remove(db_file.storage_path)
        
        return True
    return False

def get_file_content(file_path: str):
    """Get file content from the storage path"""
    if os.path.exists(file_path):
        return file_path
    return None

def toggle_file_visibility(db: Session, file_id: int, is_public: bool, public_url_base: str):
    """Toggle file visibility between public and private"""
    update_data = FileUpdate(is_public=is_public)
    return update_file(db, file_id, update_data, public_url_base)
