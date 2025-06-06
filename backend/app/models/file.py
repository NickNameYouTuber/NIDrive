from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)  # Path in the storage system
    owner_id = Column(String, nullable=False, index=True)  # Telegram ID of the owner
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)  # NULL for files in root
    size_mb = Column(Float, nullable=False)  # Size in MB
    mime_type = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    public_url = Column(String, nullable=True)  # URL for public access if public

    # Relationships
    folder = relationship("Folder", back_populates="files")

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "owner_id": self.owner_id,
            "folder_id": self.folder_id,
            "size_mb": self.size_mb,
            "mime_type": self.mime_type,
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_deleted": self.is_deleted,
            "public_url": self.public_url
        }
