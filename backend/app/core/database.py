from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient
import os
from .config import settings

# SQLAlchemy setup for user data and metadata
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Ensure the database directory exists
os.makedirs(os.path.dirname(settings.DATABASE_PATH), exist_ok=True)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB setup for file storage metadata
mongo_client = MongoClient(settings.MONGO_URI)
mongo_db = mongo_client[settings.MONGO_DB_NAME]

# Function to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to get MongoDB connection
def get_mongo_db():
    return mongo_db
