"""
Конфигурационный файл для Uvicorn с настройками для поддержки больших файлов
"""

# Максимальный размер запроса (100 ГБ)
http = {
    "h11": {
        "max_incomplete_event_size": 107374182400  # 100 ГБ в байтах
    }
}

# Настройки логирования
log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO"},
    },
}

# Настройки приложения
app_dir = "app"
app = "main:app"
host = "0.0.0.0"
port = 7070
reload = True
workers = 1
timeout_keep_alive = 1200  # 20 минут для долгих загрузок
limit_concurrency = 100
limit_max_requests = 10
