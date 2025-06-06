from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import auth, files, folders, users
from .core.config import settings

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

# Include routers
app.include_router(auth.router, tags=["authentication"])
app.include_router(users.router, tags=["users"])
app.include_router(files.router, tags=["files"])
app.include_router(folders.router, tags=["folders"])

# Mount static files for public access
os.makedirs(settings.UPLOAD_DIR + "/public_files", exist_ok=True)
app.mount("/public", StaticFiles(directory=settings.UPLOAD_DIR + "/public_files"), name="public_files")

@app.get("/", tags=["root"])
async def root():
    return {"message": "Welcome to NIDrive API", "docs_url": "/docs"}
