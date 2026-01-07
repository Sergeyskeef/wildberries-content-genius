FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей (ffmpeg для видео, build-essential для сборки)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Копирование зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Установка Celery и Redis
RUN pip install celery redis flower boto3 minio

# Копирование кода
COPY . .

# Создание необходимых директорий
RUN mkdir -p storage/temp storage/thumbnails storage/videos output/carousels logs

# Запуск по умолчанию (переопределяется в docker-compose)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]


