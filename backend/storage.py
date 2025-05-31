"""
NIDrive Storage Service - специализированная система хранения файлов 
с поддержкой разделения на приватные и публичные файлы.
"""

import os
import uuid
import shutil
import logging
import gridfs
from typing import Optional, List, Dict, BinaryIO, Any
from fastapi import HTTPException, UploadFile
from pymongo import MongoClient
from pymongo.database import Database
from bson.objectid import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field

# Настройка логирования
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Модели данных
class FileMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    user_id: str
    content_type: str
    size: int
    is_public: bool = False
    folder: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    access_token: Optional[str] = None  # Для доступа к приватным файлам
    
    class Config:
        arbitrary_types_allowed = True

class StorageInfo(BaseModel):
    used: int
    total: int
    percentage: float
    
    @staticmethod
    def calculate(used_bytes: int, total_bytes: int) -> 'StorageInfo':
        percentage = (used_bytes / total_bytes) * 100 if total_bytes > 0 else 0
        return StorageInfo(
            used=used_bytes,
            total=total_bytes,
            percentage=round(percentage, 2)
        )

class StorageService:
    """Сервис для управления файловым хранилищем с использованием MongoDB и GridFS"""
    
    def __init__(self, mongo_uri: str, db_name: str, max_user_storage: int = 5 * 1024 * 1024 * 1024):
        """
        Инициализация хранилища
        
        Args:
            mongo_uri: URI для подключения к MongoDB
            db_name: Имя базы данных
            max_user_storage: Максимальный размер хранилища для пользователя (по умолчанию 5GB)
        """
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.fs = gridfs.GridFS(self.db)
        self.max_user_storage = max_user_storage
        # Коллекция для хранения метаданных файлов
        self.files_metadata = self.db.files_metadata
        
        # Создаем индексы для быстрого поиска
        self.files_metadata.create_index("user_id")
        self.files_metadata.create_index("is_public")
        self.files_metadata.create_index([("user_id", 1), ("folder", 1)])
        
    def close(self):
        """Закрыть соединение с базой данных"""
        if self.client:
            self.client.close()
            
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
            
    def get_user_storage_info(self, user_id: str) -> StorageInfo:
        """
        Получить информацию об использовании хранилища пользователем
        
        Args:
            user_id: Идентификатор пользователя
            
        Returns:
            StorageInfo: Информация о хранилище
        """
        # Получаем сумму размеров всех файлов пользователя
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total_size": {"$sum": "$size"}}}
        ]
        result = list(self.files_metadata.aggregate(pipeline))
        used = result[0]["total_size"] if result else 0
        
        return StorageInfo.calculate(used, self.max_user_storage)
    
    async def save_file(self, 
                 file: UploadFile, 
                 user_id: str, 
                 folder: Optional[str] = None,
                 is_public: bool = False) -> FileMetadata:
        """
        Сохранить файл в хранилище
        
        Args:
            file: Загружаемый файл
            user_id: Идентификатор пользователя
            folder: Папка для хранения
            is_public: Является ли файл публичным
            
        Returns:
            FileMetadata: Метаданные сохраненного файла
            
        Raises:
            HTTPException: Если превышен лимит хранилища или произошла ошибка
        """
        # Проверка доступного места
        storage_info = self.get_user_storage_info(user_id)
        content = await file.read()
        file_size = len(content)
        
        if storage_info.used + file_size > self.max_user_storage:
            raise HTTPException(
                status_code=400,
                detail=f"Недостаточно места. Использовано: {storage_info.used} байт. Размер файла: {file_size} байт. Максимум: {self.max_user_storage} байт."
            )
            
        try:
            # Генерируем уникальный токен доступа для приватных файлов
            access_token = str(uuid.uuid4()) if not is_public else None
            
            # Сохраняем файл в GridFS
            file_id = self.fs.put(content, filename=file.filename, content_type=file.content_type)
            
            # Создаем метаданные файла
            metadata = FileMetadata(
                id=str(file_id),
                filename=file.filename,
                user_id=user_id,
                content_type=file.content_type or "application/octet-stream",
                size=file_size,
                is_public=is_public,
                folder=folder,
                access_token=access_token
            )
            
            # Сохраняем метаданные в отдельной коллекции
            self.files_metadata.insert_one(metadata.dict())
            
            return metadata
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении файла: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Не удалось сохранить файл: {str(e)}")
        finally:
            await file.seek(0)  # Сбрасываем позицию в файле на начало для возможного повторного чтения
    
    def get_file(self, file_id: str, user_id: Optional[str] = None, access_token: Optional[str] = None) -> tuple:
        """
        Получить файл из хранилища
        
        Args:
            file_id: Идентификатор файла
            user_id: Идентификатор пользователя (для проверки доступа)
            access_token: Токен доступа для приватных файлов
            
        Returns:
            tuple: (файловый объект, метаданные)
            
        Raises:
            HTTPException: Если файл не найден или доступ запрещен
        """
        try:
            # Получаем метаданные
            metadata = self.files_metadata.find_one({"id": file_id})
            
            if not metadata:
                raise HTTPException(status_code=404, detail="Файл не найден")
                
            # Проверяем права доступа
            if not metadata["is_public"]:
                if not user_id and not access_token:
                    raise HTTPException(status_code=401, detail="Требуется авторизация")
                
                if user_id and metadata["user_id"] != user_id:
                    if not access_token or metadata.get("access_token") != access_token:
                        raise HTTPException(status_code=403, detail="Доступ запрещен")
            
            # Получаем файл из GridFS
            file_obj = self.fs.get(ObjectId(file_id))
            
            # Преобразуем метаданные в модель Pydantic
            file_metadata = FileMetadata(**metadata)
            
            return file_obj, file_metadata
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Ошибка при получении файла {file_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Не удалось получить файл: {str(e)}")
    
    def list_user_files(self, user_id: str, folder: Optional[str] = None) -> List[FileMetadata]:
        """
        Получить список файлов пользователя
        
        Args:
            user_id: Идентификатор пользователя
            folder: Папка для фильтрации (опционально)
            
        Returns:
            List[FileMetadata]: Список метаданных файлов
        """
        query = {"user_id": user_id}
        
        # Если указана папка, фильтруем по ней
        if folder:
            query["folder"] = folder
            
        results = self.files_metadata.find(query).sort("created_at", -1)
        
        # Преобразуем результаты в модели Pydantic
        return [FileMetadata(**doc) for doc in results]
    
    def get_folders(self, user_id: str) -> List[str]:
        """
        Получить список папок пользователя
        
        Args:
            user_id: Идентификатор пользователя
            
        Returns:
            List[str]: Список уникальных папок
        """
        pipeline = [
            {"$match": {"user_id": user_id, "folder": {"$ne": None}}},
            {"$group": {"_id": "$folder"}},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(self.files_metadata.aggregate(pipeline))
        return [doc["_id"] for doc in results if doc["_id"]]
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        """
        Удалить файл
        
        Args:
            file_id: Идентификатор файла
            user_id: Идентификатор пользователя
            
        Returns:
            bool: True если файл успешно удален
            
        Raises:
            HTTPException: Если файл не найден или доступ запрещен
        """
        # Получаем метаданные
        metadata = self.files_metadata.find_one({"id": file_id})
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Файл не найден")
            
        # Проверяем права доступа - только владелец может удалить файл
        if metadata["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Доступ запрещен - вы не можете удалить этот файл")
        
        try:
            # Удаляем файл из GridFS
            self.fs.delete(ObjectId(file_id))
            
            # Удаляем метаданные
            self.files_metadata.delete_one({"id": file_id})
            
            return True
        except Exception as e:
            logger.error(f"Ошибка при удалении файла {file_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Не удалось удалить файл: {str(e)}")
    
    def set_file_privacy(self, file_id: str, user_id: str, is_public: bool) -> FileMetadata:
        """
        Изменить статус приватности файла
        
        Args:
            file_id: Идентификатор файла
            user_id: Идентификатор пользователя
            is_public: Новый статус публичности
            
        Returns:
            FileMetadata: Обновленные метаданные
            
        Raises:
            HTTPException: Если файл не найден или доступ запрещен
        """
        # Получаем метаданные
        metadata = self.files_metadata.find_one({"id": file_id})
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Файл не найден")
            
        # Проверяем права доступа - только владелец может изменять статус
        if metadata["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        try:
            # Генерируем новый токен доступа только если файл становится приватным
            access_token = str(uuid.uuid4()) if not is_public else None
            
            # Обновляем метаданные
            self.files_metadata.update_one(
                {"id": file_id},
                {"$set": {"is_public": is_public, "access_token": access_token}}
            )
            
            # Получаем обновленные метаданные
            updated = self.files_metadata.find_one({"id": file_id})
            
            return FileMetadata(**updated)
        except Exception as e:
            logger.error(f"Ошибка при изменении статуса приватности файла {file_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Не удалось изменить статус приватности: {str(e)}")
