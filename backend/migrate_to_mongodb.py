"""
Скрипт для миграции данных из SQLite (старая система) в MongoDB (новая система)
"""

import os
import sys
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Настраиваем логирование
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Загружаем переменные окружения
load_dotenv()

# Импортируем модули после загрузки переменных
from database import SessionLocal, engine
import models
from storage import StorageService, FileMetadata

# Получаем URI для MongoDB из переменных окружения
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.environ.get("MONGO_DB", "nidrive")
MAX_USER_STORAGE = int(os.environ.get("MAX_USER_STORAGE", 5 * 1024 * 1024 * 1024))  # 5GB по умолчанию

# Старые пути для файлов
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
PRIVATE_DIR = os.path.join(UPLOAD_DIR, "private")
PUBLIC_DIR = os.path.join(UPLOAD_DIR, "public")

def migrate_files():
    """Мигрировать файлы из старой системы в новую"""
    # Создаем сервис хранилища
    try:
        storage = StorageService(
            mongo_uri=MONGO_URI,
            db_name=MONGO_DB,
            max_user_storage=MAX_USER_STORAGE
        )
        
        logger.info(f"Подключение к MongoDB {MONGO_URI}/{MONGO_DB} установлено")
        
        # Получаем сессию базы данных
        db = SessionLocal()
        
        try:
            # Получаем все файлы из старой БД
            # Примечание: этот запрос может не работать, так как мы удалили модель File
            # В этом случае нужно временно восстановить модель или использовать прямые SQL-запросы
            
            try:
                # Пытаемся получить файлы через прямой SQL-запрос
                result = db.execute("SELECT id, user_id, filename, file_path, file_size, folder, is_public, created_at FROM files")
                old_files = result.fetchall()
                
                logger.info(f"Найдено {len(old_files)} файлов для миграции")
                
                # Счетчики для статистики
                success_count = 0
                error_count = 0
                skipped_count = 0
                
                for file in old_files:
                    file_id = file[0]
                    user_id = file[1]
                    filename = file[2]
                    file_path = file[3]
                    file_size = file[4]
                    folder = file[5]
                    is_public = bool(file[6])
                    created_at = file[7]
                    
                    logger.info(f"Миграция файла: {filename} (ID: {file_id})")
                    
                    # Проверяем существование файла
                    if not os.path.exists(file_path):
                        logger.warning(f"Файл {file_path} не найден, пропускаем")
                        skipped_count += 1
                        continue
                    
                    try:
                        # Открываем файл для чтения
                        with open(file_path, "rb") as f:
                            file_content = f.read()
                            
                        # Определяем тип контента (простая реализация)
                        content_type = "application/octet-stream"
                        if filename.endswith(".jpg") or filename.endswith(".jpeg"):
                            content_type = "image/jpeg"
                        elif filename.endswith(".png"):
                            content_type = "image/png"
                        elif filename.endswith(".pdf"):
                            content_type = "application/pdf"
                        elif filename.endswith(".txt"):
                            content_type = "text/plain"
                            
                        # Сохраняем файл в GridFS
                        file_id = storage.fs.put(
                            file_content, 
                            filename=filename, 
                            content_type=content_type
                        )
                        
                        # Создаем метаданные
                        metadata = FileMetadata(
                            id=str(file_id),
                            filename=filename,
                            user_id=user_id,
                            content_type=content_type,
                            size=file_size,
                            is_public=is_public,
                            folder=folder,
                            created_at=created_at,
                            access_token=None if is_public else os.urandom(16).hex()
                        )
                        
                        # Сохраняем метаданные в коллекцию
                        storage.files_metadata.insert_one(metadata.dict())
                        
                        logger.info(f"Файл {filename} успешно мигрирован в MongoDB")
                        success_count += 1
                        
                    except Exception as e:
                        logger.error(f"Ошибка при миграции файла {filename}: {str(e)}")
                        error_count += 1
                
                # Итоговая статистика
                logger.info(f"Миграция завершена. Успешно: {success_count}, Ошибок: {error_count}, Пропущено: {skipped_count}")
                
            except Exception as e:
                logger.error(f"Ошибка при получении списка файлов: {str(e)}")
                logger.info("Попробуйте временно восстановить модель File в models.py для выполнения миграции")
                
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Ошибка подключения к MongoDB: {str(e)}")
        
if __name__ == "__main__":
    logger.info("Начинаем миграцию файлов из SQLite в MongoDB")
    
    # Проверяем подключение к MongoDB
    try:
        from pymongo import MongoClient
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
        logger.info("Подключение к MongoDB успешно")
    except Exception as e:
        logger.error(f"Невозможно подключиться к MongoDB: {str(e)}")
        logger.error("Убедитесь, что MongoDB запущена и доступна")
        sys.exit(1)
    
    # Подтверждение от пользователя
    confirm = input("Это операция миграции, которая может занять время. Продолжить? (y/n): ")
    if confirm.lower() != 'y':
        logger.info("Миграция отменена пользователем")
        sys.exit(0)
    
    migrate_files()
    
    logger.info("Миграция завершена")
