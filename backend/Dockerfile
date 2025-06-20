FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create directories for file storage
RUN mkdir -p /app/uploads/private_files
RUN mkdir -p /app/uploads/public_files

EXPOSE 7070

# Увеличиваем лимит на размер запроса до 100 ГБ
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7070", "--reload", "--timeout-keep-alive", "1200"]
