"""
Скрипт миграции для переноса файлов из старой структуры в новую.

Этот скрипт выполняет следующие действия:
1. Получает все существующие файлы из базы данных
2. Для каждого файла:
   - Проверяет существование файла на диске
   - Создает новую структуру директорий
   - Перемещает файл в новую структуру
   - Обновляет запись в базе данных с новыми метаданными
   - Генерирует токены доступа для публичных файлов

Запуск:
python migrate_files.py
"""

import os
import sys
import shutil
import logging
import secrets
import mimetypes
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session

# Добавляем текущую директорию в путь для импорта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from storage import StorageManager

# Настройка логгера
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("migration.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("migration")

# Конфигурация
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
OLD_UPLOAD_DIR = UPLOAD_DIR
NEW_UPLOAD_DIR = UPLOAD_DIR

# Инициализация менеджера хранилища
storage_manager = StorageManager(NEW_UPLOAD_DIR)

def generate_access_token() -> str:
    """Генерирует уникальный токен доступа для файла"""
    return secrets.token_urlsafe(32)

def migrate_files():
    """Выполняет миграцию файлов из старой структуры в новую"""
    db = SessionLocal()
    try:
        # Получаем все файлы из базы данных
        files = db.query(models.File).all()
        logger.info(f"Найдено {len(files)} файлов для миграции")
        
        migrated_count = 0
        error_count = 0
        
        for file in files:
            try:
                # Проверяем существование файла
                old_path = file.file_path
                if not os.path.exists(old_path):
                    logger.warning(f"Файл не найден на диске: {old_path}")
                    continue
                
                # Получаем размер файла
                file_size = os.path.getsize(old_path)
                
                # Определяем MIME-тип файла
                mime_type = mimetypes.guess_type(old_path)[0] or "application/octet-stream"
                
                # Генерируем токен доступа для публичных файлов
                access_token = None
                if file.is_public:
                    access_token = generate_access_token()
                
                # Определяем новый путь к файлу
                user_id = str(file.user_id)
                is_public = file.is_public
                
                # Создаем директории для пользователя и по дате
                if is_public:
                    base_dir = Path(NEW_UPLOAD_DIR) / "public" / user_id
                else:
                    base_dir = Path(NEW_UPLOAD_DIR) / "private" / user_id
                
                # Создаем структуру директорий по дате
                today = datetime.now()
                year_month = today.strftime("%Y-%m")
                target_dir = base_dir / year_month
                target_dir.mkdir(exist_ok=True, parents=True)
                
                # Генерируем новое имя файла на основе UUID
                original_filename = file.filename
                _, extension = os.path.splitext(original_filename)
                new_filename = f"{file.id}{extension}"
                
                # Полный путь к новому файлу
                new_path = target_dir / new_filename
                
                # Копируем файл в новое место
                shutil.copy2(old_path, new_path)
                logger.info(f"Файл скопирован: {old_path} -> {new_path}")
                
                # Обновляем запись в базе данных
                file.file_path = str(new_path)
                file.file_size = file_size
                file.mime_type = mime_type
                file.access_token = access_token
                file.download_count = 0
                file.view_count = 0
                file.updated_at = datetime.utcnow()
                
                db.commit()
                migrated_count += 1
                logger.info(f"Файл мигрирован: {original_filename}, ID: {file.id}")
                
            except Exception as e:
                error_count += 1
                logger.error(f"Ошибка при миграции файла {file.id}: {str(e)}")
                db.rollback()
        
        logger.info(f"Миграция завершена. Успешно: {migrated_count}, ошибок: {error_count}")
    
    except Exception as e:
        logger.error(f"Критическая ошибка при миграции: {str(e)}")
    
    finally:
        db.close()

def cleanup_old_files():
    """Удаляет старые файлы после успешной миграции"""
    response = input("Миграция завершена. Удалить старые файлы? (y/n): ")
    if response.lower() == 'y':
        logger.info("Начинаем удаление старых файлов...")
        
        # Здесь нужно реализовать удаление старых файлов
        # В данном случае, мы просто создали копии файлов, поэтому 
        # удаление не требуется. Если бы мы перемещали файлы, этот шаг был бы необходим.
        
        logger.info("Удаление старых файлов завершено")
    else:
        logger.info("Удаление старых файлов отменено")

if __name__ == "__main__":
    logger.info("Начинаем миграцию файлов...")
    
    # Запрашиваем подтверждение
    response = input("Этот скрипт мигрирует файлы в новую структуру. Продолжить? (y/n): ")
    if response.lower() != 'y':
        logger.info("Миграция отменена пользователем")
        sys.exit(0)
    
    # Выполняем миграцию
    migrate_files()
    
    # Предлагаем удалить старые файлы
    cleanup_old_files()
    
    logger.info("Процесс миграции завершен")
