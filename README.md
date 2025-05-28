# NIDrive - Персональное хранилище файлов

NIDrive - это персональное хранилище файлов с доступом через веб-интерфейс и Telegram бота. Система позволяет загружать, хранить и управлять файлами с ограничением 5 ГБ на пользователя.

## Архитектура

Проект состоит из трех микросервисов:

1. **Backend API (Python/FastAPI)** - отвечает за хранение файлов, аутентификацию и управление данными
2. **Frontend (React/TypeScript/Tailwind CSS)** - предоставляет веб-интерфейс для работы с файлами
3. **Telegram  (Python)** - позволяет взаимодействовать с хранилищем через Telegram

## Настройка и запуск

### Запуск с использованием Docker (рекомендуется)

Проект полностью контейнеризирован и может быть запущен с помощью Docker Compose:

1. Убедитесь, что на вашем компьютере установлены Docker и Docker Compose:
   ```
   docker --version
   docker-compose --version
   ```

2. Создайте файл `.env` в корне проекта или используйте готовый пример:
   ```
   cp .env.example .env
   ```

3. Настройте переменные окружения в файле `.env`, обязательно укажите ваш Telegram  Token.

4. Запустите все сервисы одной командой:
   ```
   docker-compose up -d
   ```

5. Проверьте, что все сервисы работают:
   ```
   docker-compose ps
   ```

Сервисы будут доступны по следующим адресам:
- Backend API: http://localhost:7070
- Frontend: http://localhost:7071
- Telegram : запущен в фоновом режиме

Для просмотра логов используйте:
```
docker-compose logs -f [service_name]
```
где `[service_name]` - один из: `backend`, `frontend`, `telegram-` или пропустите для просмотра всех логов.

Для остановки всех сервисов:
```
docker-compose down
```

### Запуск без Docker (для разработки)

#### Настройка окружения

Создайте файл `.env` в корне проекта со следующими параметрами:

```
# Общие настройки
SECRET_KEY=your-secret-key-change-me
UPLOAD_DIR=./uploads

# Настройки Telegram
TELEGRAM__TOKEN=your-telegram--token
WEB_APP_URL=http://localhost:7071
API_BASE_URL=http://localhost:7070
```

#### Backend (Python/FastAPI)

1. Перейдите в директорию backend:
   ```
   cd backend
   ```

2. Создайте виртуальное окружение:
   ```
   python -m venv venv
   ```

3. Активируйте виртуальное окружение:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Установите зависимости:
   ```
   pip install -r requirements.txt
   ```

5. Запустите сервер:
   ```
   uvicorn main:app --host 0.0.0.0 --port 7070 --reload
   ```

Backend API будет доступен по адресу http://localhost:7070

#### Frontend (React/TypeScript/Tailwind CSS)

1. Перейдите в директорию frontend:
   ```
   cd frontend
   ```

2. Установите зависимости:
   ```
   npm install
   ```

3. Запустите сервер разработки:
   ```
   npm run dev
   ```

Веб-интерфейс будет доступен по адресу http://localhost:7071

#### Telegram  (Python)

1. Перейдите в директорию telegram_:
   ```
   cd telegram_
   ```

2. Создайте виртуальное окружение:
   ```
   python -m venv venv
   ```

3. Активируйте виртуальное окружение:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Установите зависимости:
   ```
   pip install -r requirements.txt
   ```

5. Запустите бота:
   ```
   python main.py
   ```

## Функциональность

### Веб-интерфейс

- Аутентификация через Telegram
- Просмотр загруженных файлов
- Загрузка новых файлов
- Получение ссылок на файлы
- Управление хранилищем (удаление файлов)
- Статистика использования

### Telegram бот

- Загрузка файлов через сообщения
- Просмотр списка файлов
- Получение ссылок на файлы
- Статистика использования хранилища
- Удаление файлов

## Технический стек

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Telegram **: Python, python-telegram-

## Развертывание в продакшн

Для развертывания в продакшн рекомендуется:

1. Использовать NGINX в качестве прокси-сервера
2. Настроить HTTPS с помощью Let's Encrypt
3. Использовать базу данных PostgreSQL вместо SQLite
4. Настроить системный сервис для запуска всех компонентов
5. Использовать Docker для изоляции компонентов

## Разработка

### Структура проекта

```
NIDrive/
├── backend/              # FastAPI бэкенд
│   ├── main.py           # Основной файл приложения
│   ├── models.py         # Модели базы данных
│   ├── schemas.py        # Pydantic схемы
│   ├── auth.py           # Аутентификация
│   ├── database.py       # Настройки базы данных
│   └── requirements.txt  # Зависимости
│
├── frontend/             # React/TS фронтенд
│   ├── src/              # Исходный код
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── contexts/     # React контексты
│   │   ├── hooks/        # Пользовательские хуки
│   │   ├── services/     # Сервисы API
│   │   └── types/        # TypeScript типы
│   └── ...
│
└── telegram_/         # Telegram бот
    ├── main.py           # Основной файл бота
    └── requirements.txt  # Зависимости
```
