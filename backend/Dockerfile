FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create directories for file storage
RUN mkdir -p /app/uploads/private_files
RUN mkdir -p /app/uploads/public_files

EXPOSE 7070

# Увеличиваем лимит на размер запроса до 100 ГБ через конфигурационный файл
CMD ["uvicorn", "--config", "uvicorn_config.py"]
