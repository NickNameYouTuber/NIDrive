"""
Диагностические маршруты для отладки NIDrive
"""
from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/diagnostics/ping")
async def ping():
    """Простой маршрут для проверки доступности сервера"""
    return {"status": "ok", "message": "Backend is running"}

@router.get("/diagnostics/request-info")
async def request_info(request: Request):
    """Получить информацию о запросе для отладки"""
    client_host = request.client.host if request.client else "unknown"
    
    headers = {}
    for name, value in request.headers.items():
        headers[name] = value
    
    return {
        "client": client_host,
        "method": request.method,
        "url": str(request.url),
        "headers": headers,
        "path_params": request.path_params,
        "query_params": dict(request.query_params),
    }

@router.get("/diagnostics/nginx-test")
async def nginx_test():
    """Тест для проверки правильности настройки Nginx"""
    return {
        "status": "ok",
        "message": "If you see this, Nginx is correctly routing requests to the backend"
    }

@router.get("/diagnostics/routes")
async def get_routes():
    """Получить список всех маршрутов, которые должны работать"""
    return {
        "api_routes": [
            "/api/files",
            "/api/files/upload",
            "/api/files/{file_id}",
            "/api/storage-info"
        ],
        "compatibility_routes": [
            "/files",
            "/storage/usage"
        ],
        "auth_routes": [
            "/auth/token",
            "/auth/register-code",
            "/auth/check-code",
            "/users/me"
        ]
    }
