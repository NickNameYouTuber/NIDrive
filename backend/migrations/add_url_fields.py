"""
Скрипт для миграции базы данных - добавление полей private_url и public_url в таблицу files
"""
import os
import sys
import sqlite3
from pathlib import Path

# Добавляем путь к родительскому каталогу в PYTHONPATH
sys.path.append(str(Path(__file__).parent.parent))

from database import engine, Base, SessionLocal
from sqlalchemy import text
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_sqlite():
    """Миграция для SQLite базы данных"""
    try:
        # Получаем путь к файлу БД из строки подключения
        db_path = engine.url.database
        logger.info(f"SQLite database path: {db_path}")
        
        # Подключаемся напрямую к SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем наличие колонок
        cursor.execute("PRAGMA table_info(files)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Добавляем колонки, если их нет
        if "private_url" not in columns:
            logger.info("Добавление колонки private_url...")
            cursor.execute("ALTER TABLE files ADD COLUMN private_url TEXT")
            # Устанавливаем значение по умолчанию для существующих записей
            cursor.execute("UPDATE files SET private_url = '/files/' || id")
        
        if "public_url" not in columns:
            logger.info("Добавление колонки public_url...")
            cursor.execute("ALTER TABLE files ADD COLUMN public_url TEXT")
            # Устанавливаем значение для публичных файлов
            cursor.execute("UPDATE files SET public_url = '/public/' || id WHERE is_public = 1")
        
        conn.commit()
        conn.close()
        logger.info("Миграция SQLite завершена успешно")
        
    except Exception as e:
        logger.error(f"Ошибка при миграции SQLite: {e}")
        raise

def migrate_postgresql():
    """Миграция для PostgreSQL базы данных"""
    try:
        session = SessionLocal()
        
        # Проверяем наличие колонки private_url
        try:
            session.execute(text("SELECT private_url FROM files LIMIT 1"))
            private_url_exists = True
        except:
            private_url_exists = False
        
        # Проверяем наличие колонки public_url
        try:
            session.execute(text("SELECT public_url FROM files LIMIT 1"))
            public_url_exists = True
        except:
            public_url_exists = False
            
        # Добавляем колонки, если их нет
        if not private_url_exists:
            logger.info("Добавление колонки private_url...")
            session.execute(text("ALTER TABLE files ADD COLUMN private_url TEXT"))
            session.execute(text("UPDATE files SET private_url = '/files/' || id"))
            session.execute(text("ALTER TABLE files ALTER COLUMN private_url SET NOT NULL"))
        
        if not public_url_exists:
            logger.info("Добавление колонки public_url...")
            session.execute(text("ALTER TABLE files ADD COLUMN public_url TEXT"))
            session.execute(text("UPDATE files SET public_url = '/public/' || id WHERE is_public = true"))
            
        session.commit()
        logger.info("Миграция PostgreSQL завершена успешно")
        
    except Exception as e:
        logger.error(f"Ошибка при миграции PostgreSQL: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def main():
    """Основная функция для запуска миграции"""
    try:
        logger.info("Начинаем миграцию базы данных...")
        # Определяем тип базы данных по engine.url.drivername
        if engine.url.drivername.startswith('sqlite'):
            migrate_sqlite()
        elif engine.url.drivername.startswith('postgresql'):
            migrate_postgresql()
        else:
            logger.error(f"Неподдерживаемый тип базы данных: {engine.url.drivername}")
            sys.exit(1)
        
        logger.info("Миграция завершена успешно")
    except Exception as e:
        logger.error(f"Ошибка при миграции: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
