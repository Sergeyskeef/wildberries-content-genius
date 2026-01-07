# Текущее состояние проекта (Stage 0 Audit)

## 1. Структура проекта
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui (`src/`)
- **Backend:** Python FastAPI (`api/`)
- **Database:** PostgreSQL (Local/VM)
- **Infrastructure:** Virtual Environment (`venv`), Docker (partial support via `docker-compose.yml` in docs, but running locally now).

## 2. Пользовательский интерфейс (Frontend)
Основные страницы (`src/pages/`):
- **Dashboard (`/`)**: Обзор статистики (собрано контента, сгенерировано постов) и быстрые действия.
- **Sources (`/sources`)**: Управление источниками контента.
    - Вкладки: Веб-сайты, YouTube, Telegram, Instagram.
    - Реализовано: Добавление источника (Instagram подключен к бэкенду), список активных источников.
- **Content (`/content`)**: Просмотр базы собранного контента.
    - Фильтры по источнику и статусу.
    - Таблица материалов (пока заглушка/mock).
- **Generator (`/generator`)**: AI-генератор постов.
    - Настройки: тема, тип контента.
    - Превью результата (текст/визуал).

**Зависимости UI:**
- `lucide-react` (иконки)
- `recharts` (графики)
- `sonner` (уведомления)
- `react-query` (управление состоянием сервера)
- `supabase-js` (осталось от шаблона, частично используется)

## 3. Бэкенд (API)
Сервер на FastAPI, запущен на порту **8001**.

**Существующие эндпоинты:**
- `GET /api/health`: Проверка статуса.
- `POST /api/parse/instagram`: Запуск парсинга Instagram по хэштегу.
    - Использует `instagrapi`.
    - Сохраняет результаты в таблицу `content_sources`.
- `POST /api/analyze`: Анализ контента (статус `pending`) через OpenAI.
    - Оценивает релевантность (0-100).
    - Обновляет статус на `scored`.
- `POST /api/ideas/{id}/approve`: Одобрение идеи и генерация карусели.
    - Генерирует структуру через OpenAI.
    - Рендерит PNG слайды через Pillow.
    - Создает ZIP архив.

**Зависимости Backend:**
- `fastapi`, `uvicorn`
- `sqlalchemy`, `psycopg2-binary`
- `openai` (GPT-4 Turbo)
- `instagrapi`
- `pillow`

## 4. Хранение данных
**PostgreSQL** (Локальная установка).
Схема БД (`database/models.py`):
- `content_sources`: Сырые данные (URL, платформа, текст, метаданные, статус, оценка).
- `accounts`: Источники для мониторинга.
- `carousel_plans`: Структура сгенерированных каруселей (JSON).
- `carousels`: Готовые файлы (путь к ZIP).

**Файловое хранилище:**
- `storage/`: Временные файлы.
- `output/`: Готовые карусели (ZIP).

## 5. Текущий статус интеграции
- Фронтенд настроен на проксирование `/api` -> `http://localhost:8001` (через `vite.config.ts`).
- Страница `Sources` вызывает `POST /api/parse/instagram`.
- Остальные страницы пока используют мок-данные или старый код Supabase.

