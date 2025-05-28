FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директорию для загрузок
RUN mkdir -p uploads

# Открываем порт
EXPOSE 7070

# Запускаем сервер с включенным режимом перезагрузки
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7070", "--reload"]
