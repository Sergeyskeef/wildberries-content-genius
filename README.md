# Content Factory (Zavod)

Проект по автоматизированному созданию контента: парсинг, анализ с помощью LLM (OpenAI) и генерация карточек (каруселей) для социальных сетей.

## Основные возможности
- **Парсинг контента**: Интеграция с Apify для сбора данных из Instagram.
- **LLM Анализ**: Оценка контента и генерация идей для постов через OpenAI GPT-4.
- **Генерация изображений**: Автоматическое создание PNG-слайдов для каруселей.
- **Асинхронная работа**: Celery + Redis для обработки тяжелых задач в фоновом режиме.
- **S3 Хранилище**: Использование MinIO для хранения сгенерированных артефактов (ZIP, изображения).
- **Docker-first**: Полная контейнеризация всех сервисов.

## Технологический стек
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Python (FastAPI), SQLAlchemy (PostgreSQL).
- **Очереди задач**: Celery, Redis.
- **Хранилище**: MinIO (S3-совместимое).
- **Мониторинг**: Flower (для Celery).

## Быстрый запуск (Docker)

1. Убедитесь, что у вас установлены `docker` и `docker-compose`.
2. Настройте файл `.env` (укажите свои API ключи).
3. Запустите проект:
   ```bash
   docker compose up -d --build
   ```

### Доступные порты:
- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **API (FastAPI)**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Flower (Celery Monitor)**: [http://localhost:5555](http://localhost:5555)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (логин/пароль из .env)
- **PostgreSQL**: Доступен внешне на порту **5435** (внутри контейнеров 5432).

## Структура проекта
- `api/` — FastAPI эндпоинты и логика API.
- `tasks/` — Celery задачи (парсинг, скоринг, рендеринг).
- `database/` — Модели SQLAlchemy и инициализация БД.
- `integrations/` — Клиенты для внешних API (Apify, OpenAI).
- `renderer/` — Логика генерации изображений (Pillow).
- `src/` — Исходный код фронтенда (React).
- `storage/` — Вспомогательные функции для S3 (MinIO).

## Разработка без Docker (Локально)
Для локального запуска API:
```bash
export PYTHONPATH=$PYTHONPATH:.
venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8001
```
Для локального запуска фронтенда:
```bash
npm install
npm run dev
```
