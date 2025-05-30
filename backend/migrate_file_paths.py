#!/usr/bin/env python3
import os
import sys
import shutil
from pathlib import Path
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Пути к директориям
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
PRIVATE_DIR = os.path.join(UPLOAD_DIR, "private")
PUBLIC_DIR = os.path.join(UPLOAD_DIR, "public")

# Создаем директории, если они не существуют
os.makedirs(PRIVATE_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

def migrate_files():
    """Перемещает файлы из старой структуры в новую и обновляет пути в БД"""
    db = SessionLocal()
    try:
        # Получаем все файлы из БД
        files = db.query(models.File).all()
        print(f"Всего файлов в БД: {len(files)}")
        
        for file in files:
            # Проверяем существование файла
            file_path = Path(file.file_path)
            
            if not file_path.exists():
                print(f"Файл не найден: {file.file_path}")
                continue
                
            # Определяем директорию для файла
            target_dir = PUBLIC_DIR if file.is_public else PRIVATE_DIR
            
            # Формируем имя для нового файла
            user_dir = Path(target_dir) / file.user_id
            os.makedirs(user_dir, exist_ok=True)
            
            # Имя файла и папка (если есть)
            filename = file_path.name
            folder_name = None
            
            # Если в пути есть папка, создаем ее
            if '/' in file.file_url or '\\' in file.file_url:
                parts = file.file_url.split('/')
                if len(parts) > 2:
                    # В URL может быть папка
                    for part in parts[:-1]:
                        if part != "files" and part != "public" and part != file.user_id:
                            folder_name = part
                            break
            
            # Создаем целевой путь
            if folder_name:
                folder_path = user_dir / folder_name
                os.makedirs(folder_path, exist_ok=True)
                target_path = folder_path / filename
            else:
                target_path = user_dir / filename
                
            # Копируем файл если нужно
            if file_path != target_path:
                print(f"Копирование файла: {file.filename}")
                print(f"  из: {file_path}")
                print(f"  в: {target_path}")
                shutil.copy2(file_path, target_path)
                
                # Удаляем оригинал если копирование прошло успешно
                if target_path.exists():
                    try:
                        file_path.unlink()
                        print(f"  Удален оригинал: {file_path}")
                    except Exception as e:
                        print(f"  Ошибка при удалении оригинала: {e}")
            
            # Обновляем путь в БД
            old_path = file.file_path
            old_url = file.file_url
            
            file.file_path = str(target_path)
            
            # Обновляем URL
            if file.is_public:
                # URL для публичных файлов
                file_url = f"/public/{file.user_id}/{filename if not folder_name else folder_name + '/' + filename}"
                file.file_url = file_url
                file.public_url = file_url
            else:
                # URL для приватных файлов
                file_url = f"/files/{file.user_id}/{filename if not folder_name else folder_name + '/' + filename}"
                file.file_url = file_url
                file.public_url = None
                
            print(f"Обновлен путь файла: {file.id}")
            print(f"  Старый путь: {old_path}")
            print(f"  Новый путь: {file.file_path}")
            print(f"  Старый URL: {old_url}")
            print(f"  Новый URL: {file.file_url}")
            
        # Сохраняем изменения в БД
        db.commit()
        print("Миграция завершена успешно.")
        
    except Exception as e:
        db.rollback()
        print(f"Ошибка при миграции: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Начало миграции файлов...")
    migrate_files()
    print("Миграция завершена.")
