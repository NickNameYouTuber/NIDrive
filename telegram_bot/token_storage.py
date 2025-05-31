import json
import os
from typing import Optional, Dict, Any

# Файл для хранения токенов
TOKEN_FILE = "user_tokens.json"

class TokenStorage:
    """Простое хранилище токенов пользователей"""
    
    def __init__(self):
        self.tokens = {}
        self.load_tokens()
    
    def load_tokens(self):
        """Загрузить токены из файла"""
        if os.path.exists(TOKEN_FILE):
            try:
                with open(TOKEN_FILE, 'r') as f:
                    self.tokens = json.load(f)
            except json.JSONDecodeError:
                self.tokens = {}
        else:
            self.tokens = {}
    
    def save_tokens(self):
        """Сохранить токены в файл"""
        with open(TOKEN_FILE, 'w') as f:
            json.dump(self.tokens, f)
    
    def get_token(self, user_id: str) -> Optional[str]:
        """Получить токен для пользователя"""
        return self.tokens.get(user_id)
    
    def set_token(self, user_id: str, token: str):
        """Установить токен для пользователя"""
        self.tokens[user_id] = token
        self.save_tokens()
    
    def delete_token(self, user_id: str):
        """Удалить токен пользователя"""
        if user_id in self.tokens:
            del self.tokens[user_id]
            self.save_tokens()

# Создаем синглтон для хранилища токенов
token_storage = TokenStorage()
