"""
Настройки для загрузки больших файлов в FastAPI
"""
from starlette.datastructures import UploadFile as StarletteUploadFile
from fastapi import UploadFile as FastAPIUploadFile

# Переопределяем максимальный размер файла для загрузки (100 ГБ)
# 100 ГБ в байтах = 107374182400
StarletteUploadFile.spool_max_size = 107374182400
FastAPIUploadFile.spool_max_size = 107374182400
