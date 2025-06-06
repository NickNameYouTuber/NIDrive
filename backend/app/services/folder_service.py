from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Any

from ..models.folder import Folder
from ..models.file import File
from ..models.schemas import FolderCreate, FolderUpdate, FolderTree

def create_folder(db: Session, folder: FolderCreate, owner_id: str):
    """Create a new folder"""
    db_folder = Folder(
        name=folder.name,
        parent_id=folder.parent_id,
        owner_id=owner_id
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

def get_folders_by_owner(db: Session, owner_id: str, parent_id: int = None):
    """Get all active folders for a user, optionally filtered by parent folder"""
    query = db.query(Folder).filter(
        Folder.owner_id == owner_id,
        Folder.is_deleted == False
    )
    
    if parent_id is not None:
        query = query.filter(Folder.parent_id == parent_id)
    
    return query.all()

def get_folder_by_id(db: Session, folder_id: int):
    """Get a folder by its ID"""
    return db.query(Folder).filter(Folder.id == folder_id).first()

def is_owner_of_folder(db: Session, folder_id: int, owner_id: str):
    """Check if a user is the owner of a folder"""
    folder = get_folder_by_id(db, folder_id)
    return folder and folder.owner_id == owner_id

def update_folder(db: Session, folder_id: int, folder_update: FolderUpdate):
    """Update folder metadata"""
    db_folder = get_folder_by_id(db, folder_id)
    if not db_folder:
        return None
        
    # Update allowed fields
    for key, value in folder_update.dict(exclude_unset=True, exclude_none=True).items():
        setattr(db_folder, key, value)
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

def delete_folder(db: Session, folder_id: int, owner_id: str):
    """Mark a folder and all its contents as deleted"""
    db_folder = get_folder_by_id(db, folder_id)
    if not db_folder or db_folder.owner_id != owner_id or db_folder.is_deleted:
        return False
        
    # Mark this folder as deleted
    db_folder.is_deleted = True
    
    # Mark all files in this folder as deleted
    files_in_folder = db.query(File).filter(
        File.folder_id == folder_id,
        File.is_deleted == False
    ).all()
    
    for file in files_in_folder:
        file.is_deleted = True
    
    # Recursively delete all subfolders
    subfolders = db.query(Folder).filter(
        Folder.parent_id == folder_id,
        Folder.is_deleted == False
    ).all()
    
    for subfolder in subfolders:
        delete_folder(db, subfolder.id, owner_id)
    
    db.commit()
    return True

def get_folder_tree(db: Session, owner_id: str) -> List[FolderTree]:
    """
    Build a folder tree structure for a user
    Returns a list of root folders with their nested children and files
    """
    # Get all folders for this owner
    all_folders = db.query(Folder).filter(
        Folder.owner_id == owner_id,
        Folder.is_deleted == False
    ).all()
    
    # Create a lookup dict for fast access
    folder_dict = {folder.id: folder for folder in all_folders}
    
    # Initialize tree structure with root folders (those with parent_id=None)
    root_folders = [folder for folder in all_folders if folder.parent_id is None]
    
    # Convert to tree structure
    result = []
    for root in root_folders:
        tree_node = build_folder_tree(db, root, folder_dict)
        result.append(tree_node)
    
    return result

def build_folder_tree(db: Session, folder: Folder, folder_dict: Dict[int, Folder]) -> FolderTree:
    """
    Recursively build a folder tree starting from a given folder
    """
    # Get all direct children of this folder
    children = [f for f in folder_dict.values() if f.parent_id == folder.id]
    
    # Get all files in this folder
    files = db.query(File).filter(
        File.folder_id == folder.id,
        File.is_deleted == False
    ).all()
    
    # Build child trees recursively
    child_trees = []
    for child in children:
        child_tree = build_folder_tree(db, child, folder_dict)
        child_trees.append(child_tree)
    
    # Create the tree node for this folder
    tree_node = FolderTree(
        id=folder.id,
        name=folder.name,
        owner_id=folder.owner_id,
        parent_id=folder.parent_id,
        children=child_trees,
        files=files
    )
    
    return tree_node
