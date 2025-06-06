import os
from typing import Any, Dict, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "NIDrive"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-me")
    # 60 minutes * 24 hours * 7 days = 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./db/nidrive.db")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./db/nidrive.db")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    MAX_USER_STORAGE_MB: int = int(os.getenv("MAX_USER_STORAGE_MB", 1024))  # Default 1GB

    # MongoDB settings
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "file_storage")
    
    # File size limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 200))  # Default 200MB per file
    
    # Public URL for file access
    PUBLIC_URL: str = os.getenv("PUBLIC_URL", "http://localhost:7070")
    
    class Config:
        case_sensitive = True

settings = Settings()
