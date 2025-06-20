from sqlalchemy.orm import Session
from ..models.user import User
from ..models.schemas import UserCreate, UserUpdate, UserStats
from ..models.file import File
from ..models.folder import Folder
from sqlalchemy import func, or_

def get_user_by_telegram_id(db: Session, telegram_id: str):
    """Get user by Telegram ID"""
    return db.query(User).filter(User.telegram_id == telegram_id).first()

def create_user_if_not_exists(db: Session, user_data: UserCreate):
    """Create a new user if doesn't exist, otherwise update existing user"""
    user = get_user_by_telegram_id(db, user_data.telegram_id)
    
    if user:
        # Update existing user information
        for key, value in user_data.dict(exclude_unset=True).items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user
    db_user = User(**user_data.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user: User, user_update: UserUpdate):
    """Update user information"""
    for key, value in user_update.dict(exclude_unset=True, exclude_none=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

def get_user_stats(db: Session, user: User):
    """Get statistics about user's storage usage"""
    # Count active files and folders (not deleted)
    total_files = db.query(func.count(File.id)).filter(
        File.owner_id == user.telegram_id,
        File.is_deleted == False
    ).scalar()
    
    total_folders = db.query(func.count(Folder.id)).filter(
        Folder.owner_id == user.telegram_id,
        Folder.is_deleted == False
    ).scalar()
    
    # Calculate used space and usage percentage
    used_space = user.used_space
    quota = user.quota
    usage_percent = (used_space / quota) * 100 if quota > 0 else 0
    
    return UserStats(
        total_files=total_files,
        total_folders=total_folders,
        used_space=used_space,
        quota=quota,
        usage_percent=usage_percent
    )

def update_user_space_usage(db: Session, telegram_id: str, size_change: float):
    """Update the user's space usage.
    Use positive value for size_change when adding files.
    Use negative value for size_change when removing files.
    """
    user = get_user_by_telegram_id(db, telegram_id)
    if not user:
        return None
    
    # Update used space
    user.used_space += size_change
    
    # Ensure used_space doesn't go below 0
    if user.used_space < 0:
        user.used_space = 0
    
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()


def update_user_quota(db: Session, user_id: int, new_quota: float):
    """Update a user's disk quota in MB"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    user.quota = new_quota
    db.commit()
    db.refresh(user)
    return user
