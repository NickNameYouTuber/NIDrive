import os
import shutil
import uuid
from typing import Optional, BinaryIO, Tuple
from pathlib import Path
import mimetypes
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class StorageManager:
    """
    Система управления хранилищем файлов с разделением на приватные и публичные файлы.
    
    Особенности:
    - Разделение на приватные и публичные хранилища
    - Уникальные имена файлов на основе UUID
    - Организация по пользователям и дате загрузки
    - Встроенная система разграничения доступа
    """
    
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        
        # Структура директорий
        self.private_path = self.base_path / "private"
        self.public_path = self.base_path / "public"
        
        # Создаем базовые директории
        self.private_path.mkdir(exist_ok=True, parents=True)
        self.public_path.mkdir(exist_ok=True, parents=True)
    
    def _get_user_directory(self, user_id: str, is_public: bool = False) -> Path:
        """Получить директорию пользователя"""
        base = self.public_path if is_public else self.private_path
        user_dir = base / str(user_id)
        user_dir.mkdir(exist_ok=True, parents=True)
        return user_dir
    
    def _generate_unique_filename(self) -> str:
        """Создать уникальное имя файла на основе UUID"""
        return str(uuid.uuid4())
    
    def _create_file_subdirectories(self, user_id: str, is_public: bool = False) -> Path:
        """Создать структуру директорий для хранения файла по дате"""
        user_dir = self._get_user_directory(user_id, is_public)
        today = datetime.now()
        year_month = today.strftime("%Y-%m")
        
        date_dir = user_dir / year_month
        date_dir.mkdir(exist_ok=True, parents=True)
        
        return date_dir
    
    def save_file(self, user_id: str, file_data: BinaryIO, original_filename: str, 
                 is_public: bool = False, folder: Optional[str] = None) -> Tuple[str, str, int]:
        """
        Сохранить файл в хранилище
        
        Args:
            user_id: ID пользователя
            file_data: Данные файла (файловый объект)
            original_filename: Оригинальное имя файла
            is_public: Флаг публичного доступа
            folder: Логическая папка (категория) для группировки файлов
            
        Returns:
            Tuple[str, str, int]: (file_id, file_path, file_size)
        """
        try:
            # Создаем структуру директорий
            target_dir = self._create_file_subdirectories(user_id, is_public)
            
            # Генерируем уникальный ID файла
            file_id = self._generate_unique_filename()
            
            # Определяем расширение файла из оригинального имени
            _, extension = os.path.splitext(original_filename)
            
            # Формируем имя файла с сохранением расширения
            filename = f"{file_id}{extension}"
            
            # Полный путь к файлу
            file_path = target_dir / filename
            
            # Сохраняем файл
            file_data.seek(0)  # Убедимся, что читаем с начала файла
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file_data, f)
            
            # Получаем размер файла
            file_size = file_path.stat().st_size
            
            logger.info(f"Файл сохранен: {file_path}, размер: {file_size} байт, public: {is_public}")
            
            return file_id, str(file_path), file_size
        
        except Exception as e:
            logger.error(f"Ошибка при сохранении файла: {str(e)}")
            raise
    
    def get_file_path(self, file_id: str, user_id: str, original_filename: str, 
                     is_public: bool) -> Optional[str]:
        """
        Получить путь к файлу по его ID и параметрам
        
        Args:
            file_id: ID файла
            user_id: ID пользователя
            original_filename: Оригинальное имя файла
            is_public: Флаг публичного доступа
            
        Returns:
            Optional[str]: Путь к файлу или None, если файл не найден
        """
        # Определяем базовую директорию (приватную или публичную)
        base_dir = self.public_path if is_public else self.private_path
        
        # Для поиска нам нужно было бы просканировать все возможные поддиректории,
        # но поскольку у нас есть полный путь в базе данных, этот метод используется
        # больше для валидации существования файла и проверки соответствия параметрам
        
        # Проверяем, есть ли файл в системе
        for root, _, files in os.walk(base_dir / str(user_id)):
            for file in files:
                if file.startswith(file_id):
                    file_path = Path(root) / file
                    return str(file_path)
        
        return None
    
    def delete_file(self, file_path: str) -> bool:
        """
        Удалить файл из хранилища
        
        Args:
            file_path: Полный путь к файлу
            
        Returns:
            bool: True, если файл успешно удален, False в противном случае
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Файл удален: {file_path}")
                return True
            else:
                logger.warning(f"Файл не найден при попытке удаления: {file_path}")
                return False
        except Exception as e:
            logger.error(f"Ошибка при удалении файла {file_path}: {str(e)}")
            return False
    
    def move_file(self, file_path: str, user_id: str, is_public: bool) -> Optional[str]:
        """
        Переместить файл между приватным и публичным хранилищем
        
        Args:
            file_path: Текущий путь к файлу
            user_id: ID пользователя
            is_public: Флаг публичного доступа (новое состояние)
            
        Returns:
            Optional[str]: Новый путь к файлу или None, если перемещение не удалось
        """
        try:
            if not os.path.exists(file_path):
                logger.warning(f"Файл не найден при попытке перемещения: {file_path}")
                return None
            
            # Получаем имя файла из полного пути
            filename = os.path.basename(file_path)
            
            # Создаем новую директорию
            target_dir = self._create_file_subdirectories(user_id, is_public)
            
            # Новый путь к файлу
            new_path = target_dir / filename
            
            # Перемещаем файл
            shutil.move(file_path, new_path)
            
            logger.info(f"Файл перемещен: {file_path} -> {new_path}")
            
            return str(new_path)
        
        except Exception as e:
            logger.error(f"Ошибка при перемещении файла {file_path}: {str(e)}")
            return None
    
    def get_file_mime_type(self, file_path: str) -> str:
        """
        Определить MIME-тип файла
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            str: MIME-тип файла
        """
        # Инициализация модуля mimetypes со всеми стандартными типами
        mimetypes.init()
        
        # Добавляем распространенные типы файлов, которые могут быть не распознаны корректно
        common_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.zip': 'application/zip',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska'
        }
        
        # Получаем расширение файла
        _, ext = os.path.splitext(file_path.lower())
        
        # Если расширение в нашем словаре, используем его тип
        if ext in common_types:
            return common_types[ext]
        
        # Иначе используем стандартное определение типа
        mime_type, _ = mimetypes.guess_type(file_path)
        
        # Если тип не определен, используем тип бинарного потока
        return mime_type or "application/octet-stream"
    
    def get_user_storage_usage(self, user_id: str) -> int:
        """
        Получить объем использованного хранилища пользователя в байтах
        
        Args:
            user_id: ID пользователя
            
        Returns:
            int: Объем использованного хранилища в байтах
        """
        total_size = 0
        
        # Считаем размер приватных файлов
        private_dir = self._get_user_directory(user_id, is_public=False)
        if private_dir.exists():
            for dirpath, _, filenames in os.walk(private_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    total_size += os.path.getsize(fp)
        
        # Считаем размер публичных файлов
        public_dir = self._get_user_directory(user_id, is_public=True)
        if public_dir.exists():
            for dirpath, _, filenames in os.walk(public_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    total_size += os.path.getsize(fp)
        
        return total_size
