from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from .api import auth, files, folders, users, admin
from .core.config import settings
from .core.database import Base, engine

# Настройки для загрузки больших файлов
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

# Импортируем настройки для загрузки больших файлов
from .core import upload_settings

# Middleware для увеличения таймаута
class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

# Создаем конфигурацию FastAPI с увеличенным лимитом на размер файлов
from fastapi.openapi.utils import get_openapi

# Настройка для больших файлов
from starlette.requests import Request
from starlette.responses import Response

# Увеличиваем лимит на размер загружаемых файлов
from fastapi import UploadFile as FastAPIUploadFile
from starlette.datastructures import UploadFile as StarletteUploadFile

# Устанавливаем максимальный размер файла в 100 ГБ
FastAPIUploadFile.spool_max_size = 107374182400  # 100 ГБ в байтах
StarletteUploadFile.spool_max_size = 107374182400  # 100 ГБ в байтах

app = FastAPI(
    title="NIDrive API",
    description="API for NIDrive - Telegram-based Cloud Storage",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://drive.nicorp.tech", "http://localhost:7071"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Добавляем middleware для обработки больших файлов
app.add_middleware(TimeoutMiddleware)

# Инициализация базы данных
@app.on_event("startup")
async def startup_db_client():
    # Создаем таблицы
    Base.metadata.create_all(bind=engine)
    print("Database tables created or already exist")

# Include routers
app.include_router(auth.router, tags=["authentication"])
app.include_router(users.router, tags=["users"])
app.include_router(files.router, tags=["files"])
app.include_router(folders.router, tags=["folders"])
app.include_router(admin.router, tags=["admin"])

# Mount static files for public access
os.makedirs(settings.UPLOAD_DIR + "/public_files", exist_ok=True)
app.mount("/public", StaticFiles(directory=settings.UPLOAD_DIR + "/public_files"), name="public_files")

@app.get("/", tags=["root"])
async def root():
    return {"message": "Welcome to NIDrive API", "docs_url": "/docs"}
