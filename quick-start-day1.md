# Content Factory: БЫСТРЫЙ СТАРТ (День 1)
## Как запустить систему за 2-3 часа

---

## 📌 ЧТО МЫ СДЕЛАЕМ СЕГОДНЯ

Вы получите:
- ✅ PostgreSQL база данных (локально на VM)
- ✅ FastAPI сервер с 3 основными endpoints
- ✅ Инстаграм парсер (работающий)
- ✅ LLM интеграция (Claude анализ)
- ✅ Базовый web UI для просмотра идей

**Время:** 2-3 часа (если все гладко)

---

## ⏱️ ПЛАН РАБОТЫ

```
00:00-00:15  Подготовка окружения (Python, БД)
00:15-00:30  Клонирование и зависимости
00:30-00:45  Конфиг PostgreSQL и .env
00:45-01:00  Инициализация БД (таблицы)
01:00-01:30  Запуск FastAPI сервера
01:30-01:45  Тестирование endpoints
01:45-02:00  Первый парсинг контента (Instagram)
02:00-02:30  Анализ контента (LLM)
02:30-03:00  Просмотр результатов в web UI
```

---

## 🚀 ПОШАГОВЫЕ КОМАНДЫ

### Фаза 1: Подготовка (15 минут)

```bash
# 1. Подключиться к VM
ssh user@your-vm-ip

# 2. Перейти в /opt
cd /opt

# 3. Обновить систему
sudo apt update && sudo apt upgrade -y

# 4. Установить Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev git curl

# 5. Установить PostgreSQL
sudo apt install -y postgresql postgresql-contrib libpq-dev

# 6. Установить утилиты
sudo apt install -y ffmpeg wget build-essential

# Проверить версии
python3 --version
psql --version
```

### Фаза 2: Клонирование репо (15 минут)

```bash
# Если у вас уже есть репозиторий:
cd /opt
git clone https://github.com/your-username/content-factory.git
cd content-factory

# Если только начинаете, создайте структуру вручную:
mkdir -p content-factory
cd content-factory

# Создать структуру папок
mkdir -p {api,parser,analyzer,renderer,database,storage/{videos,thumbnails,temp},output/carousels,logs,tests}
mkdir -p renderer/{templates,fonts,themes}

# Создать Python virtual environment
python3.11 -m venv venv
source venv/bin/activate
```

### Фаза 3: Зависимости (15 минут)

```bash
# Создать requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
httpx==0.25.2

# Парсеры
instagrapi==2.0.0
yt-dlp==2023.12.30
google-api-python-client==1.12.0

# Rendering
pillow==10.1.0
jinja2==3.1.2

# LLM
anthropic==0.7.8

# Utils
apscheduler==3.10.4
python-dateutil==2.8.2
EOF

# Установить все
pip install --upgrade pip
pip install -r requirements.txt
```

### Фаза 4: PostgreSQL (15 минут)

```bash
# Запустить PostgreSQL сервис
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создать БД и пользователя
sudo -u postgres psql << 'EOF'
CREATE DATABASE content_factory;
CREATE USER cf_user WITH PASSWORD 'cf_secure_pass_2026';
ALTER ROLE cf_user SET client_encoding TO 'utf8';
ALTER ROLE cf_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE content_factory TO cf_user;
\q
EOF

# Проверить подключение
psql -h localhost -U cf_user -d content_factory -c "SELECT version();"
```

### Фаза 5: .env файл (5 минут)

```bash
# Создать .env в корне проекта
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://cf_user:cf_secure_pass_2026@localhost:5432/content_factory

# API Ключи
CLAUDE_API_KEY=sk-ant-YOUR_ACTUAL_KEY_HERE
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
INSTAGRAM_USERNAME=your_instagram_account
INSTAGRAM_PASSWORD=your_instagram_password

# Server
DEBUG=True
LOG_LEVEL=INFO
API_PORT=8000
API_HOST=0.0.0.0

# Paths
STORAGE_PATH=/opt/content-factory/storage
OUTPUT_PATH=/opt/content-factory/output

# Parsing
PARSING_INTERVAL_HOURS=6
PARSING_BATCH_SIZE=50
PARSING_RETRY_COUNT=3

# LLM
LLM_MODEL=claude-3-sonnet-20240229
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
EOF
```

### Фаза 6: Создание таблиц БД (10 минут)

Создайте файл `database/init_db.py`:

```python
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ContentSource(Base):
    __tablename__ = "content_sources"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    platform = Column(String)
    caption = Column(Text)
    metadata = Column(JSON)
    status = Column(String, default="pending")
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CarouselPlan(Base):
    __tablename__ = "carousel_plans"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer)
    title = Column(String)
    description = Column(Text)
    structure = Column(JSON)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Carousel(Base):
    __tablename__ = "carousels"
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer)
    zip_path = Column(String)
    status = Column(String, default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Создать все таблицы
Base.metadata.create_all(bind=engine)
print("✅ Database tables created!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
```

Запустить инициализацию:

```bash
python database/init_db.py
```

### Фаза 7: FastAPI приложение (20 минут)

Создайте `api/main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.init_db import SessionLocal, ContentSource, CarouselPlan
from parser.instagram_parser import InstagramParser
from analyzer.analyzer import ContentAnalyzer
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = FastAPI(title="Content Factory API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# SCHEMAS
# ============================================

class ContentSourceResponse(BaseModel):
    id: int
    url: str
    platform: str
    caption: str
    score: float
    status: str

    class Config:
        from_attributes = True

# ============================================
# ENDPOINTS
# ============================================

@app.get("/api/health")
async def health_check():
    """Проверка здоровья сервиса"""
    return {"status": "ok", "service": "content-factory"}

@app.get("/api/ideas")
async def get_top_ideas(limit: int = 20):
    """Получить топовые идеи (score > 75)"""
    db = SessionLocal()
    try:
        ideas = db.query(ContentSource).filter(
            ContentSource.score >= 75
        ).order_by(ContentSource.score.desc()).limit(limit).all()
        
        return {
            "total": len(ideas),
            "ideas": [
                {
                    "id": idea.id,
                    "url": idea.url,
                    "platform": idea.platform,
                    "caption": idea.caption[:200],
                    "score": idea.score,
                    "status": idea.status,
                }
                for idea in ideas
            ]
        }
    finally:
        db.close()

@app.post("/api/parse/instagram")
async def parse_instagram(hashtag: str = "валберриз"):
    """Запустить парсинг Instagram"""
    try:
        parser = InstagramParser(
            username=os.getenv("INSTAGRAM_USERNAME"),
            password=os.getenv("INSTAGRAM_PASSWORD")
        )
        results = parser.parse_hashtag(hashtag, amount=20)
        
        db = SessionLocal()
        for item in results:
            existing = db.query(ContentSource).filter_by(url=item["url"]).first()
            if not existing:
                source = ContentSource(
                    url=item["url"],
                    platform="instagram",
                    caption=item.get("caption"),
                    metadata=item,
                    status="pending"
                )
                db.add(source)
        db.commit()
        db.close()
        
        logger.info(f"✅ Parsed {len(results)} Instagram posts")
        return {"status": "success", "parsed": len(results)}
    
    except Exception as e:
        logger.error(f"❌ Instagram parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_pending():
    """Проанализировать контент со статусом pending"""
    try:
        analyzer = ContentAnalyzer(api_key=os.getenv("CLAUDE_API_KEY"))
        db = SessionLocal()
        
        pending = db.query(ContentSource).filter_by(status="pending").limit(5).all()
        
        for content in pending:
            score = analyzer.score_content(content)
            content.score = score
            content.status = "scored"
        
        db.commit()
        db.close()
        
        logger.info(f"✅ Analyzed {len(pending)} contents")
        return {"status": "success", "analyzed": len(pending)}
    
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ideas/{id}/approve")
async def approve_idea(id: int):
    """Одобрить идею для создания карусели"""
    db = SessionLocal()
    try:
        idea = db.query(ContentSource).filter_by(id=id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        idea.status = "approved"
        db.commit()
        
        logger.info(f"✅ Approved idea {id}")
        return {"status": "approved", "id": id}
    
    finally:
        db.close()

@app.get("/api/stats")
async def get_stats():
    """Получить статистику"""
    db = SessionLocal()
    try:
        total_contents = db.query(ContentSource).count()
        approved = db.query(ContentSource).filter_by(status="approved").count()
        carousels = db.query(CarouselPlan).count()
        
        return {
            "total_contents": total_contents,
            "approved": approved,
            "carousels": carousels,
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Фаза 8: Instagram парсер (15 минут)

Создайте `parser/instagram_parser.py`:

```python
from instagrapi import Client
import logging

logger = logging.getLogger(__name__)

class InstagramParser:
    def __init__(self, username: str, password: str):
        self.client = Client()
        try:
            self.client.login(username=username, password=password)
            logger.info("✅ Instagram login successful")
        except Exception as e:
            logger.error(f"❌ Instagram login failed: {e}")
            raise

    def parse_hashtag(self, hashtag: str, amount: int = 50) -> list:
        """Парсить Reels по хэштегу"""
        try:
            medias = self.client.hashtag_medias_recent(hashtag, amount=amount)
            
            results = []
            for media in medias:
                data = {
                    "url": f"https://instagram.com/p/{media.pk}/",
                    "platform": "instagram",
                    "caption": media.caption_text or "",
                    "likes": media.like_count,
                    "comments": media.comments_count,
                    "views": getattr(media, 'play_count', 0),
                    "author": media.user.username,
                    "author_followers": media.user.follower_count,
                    "type": "reel" if media.media_type == 2 else "carousel",
                }
                results.append(data)
            
            logger.info(f"✅ Parsed {len(results)} posts from #{hashtag}")
            return results
        
        except Exception as e:
            logger.error(f"❌ Parsing error: {e}")
            return []
```

### Фаза 9: LLM анализатор (15 минут)

Создайте `analyzer/analyzer.py`:

```python
from anthropic import Anthropic
import logging

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    def score_content(self, content) -> float:
        """Оценить контент на релевантность (0-100)"""
        try:
            prompt = f"""
Оцени этот контент на релевантность для менеджеров Wildberries и инвесторов в маркетплейсы.
Ответь ТОЛЬКО ЧИСЛО от 0 до 100.

Контент:
Caption: {content.caption[:300]}
Likes: {content.metadata.get('likes')}
Views: {content.metadata.get('views')}
Author: {content.metadata.get('author')}
"""
            
            message = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Парсить число из ответа
            response_text = message.content[0].text.strip()
            score = float(''.join(c for c in response_text if c.isdigit() or c == '.'))
            score = min(100, max(0, score))
            
            logger.info(f"✅ Scored content {content.id}: {score}")
            return score
        
        except Exception as e:
            logger.error(f"❌ Scoring error: {e}")
            return 0.0
```

### Фаза 10: Запуск FastAPI (5 минут)

```bash
# Убедиться что вы в виртуальном окружении
source venv/bin/activate

# Запустить сервер
python api/main.py

# Должно вывести:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### Фаза 11: Тестирование (10 минут)

В отдельном терминале:

```bash
# Проверить здоровье
curl http://localhost:8000/api/health

# Запустить парсинг Instagram
curl -X POST "http://localhost:8000/api/parse/instagram?hashtag=валберриз"

# Провести анализ
curl -X POST "http://localhost:8000/api/analyze"

# Получить топовые идеи
curl http://localhost:8000/api/ideas

# Получить статистику
curl http://localhost:8000/api/stats
```

---

## ✅ ЧЕК-ЛИСТ ДНЯ 1

- [ ] Python 3.11 установлен
- [ ] PostgreSQL запущен
- [ ] Репо клонировано
- [ ] Virtual environment создана
- [ ] requirements.txt установлены
- [ ] .env файл создан с API ключами
- [ ] БД таблицы созданы
- [ ] FastAPI сервер запущен
- [ ] HTTP endpoints тестированы
- [ ] Instagram парсер работает
- [ ] Claude анализ работает
- [ ] Данные сохраняются в БД

---

## 🐛 ЧАСТЫЕ ОШИБКИ И РЕШЕНИЯ

### Ошибка: "postgresql is not installed"

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Ошибка: "could not connect to server"

```bash
# Убедиться что PostgreSQL запущен
sudo systemctl status postgresql

# Проверить конфиг
sudo -u postgres psql -c "SELECT version();"
```

### Ошибка: "Instagram login failed"

```
- Проверить username/password в .env
- Убедиться что 2FA отключена
- Или использовать app-specific пароль для Gmail
```

### Ошибка: "Claude API key invalid"

```
- Перейти на https://console.anthropic.com
- Создать новый API key
- Скопировать в .env
```

---

## 🎉 ИТОГО ДЕНЬ 1

Вы получили:
✅ Работающую БД с таблицами для контента
✅ FastAPI сервер с основными endpoints
✅ Instagram парсер (парсит реальные посты)
✅ LLM анализатор (оценивает релевантность)
✅ HTTP API для управления системой

**Далее (День 2+):**
- Добавить YouTube парсер
- Реализовать rendering (создание PNG слайдов)
- Создать web UI dashboard
- Настроить расписание (cron jobs)
- Интеграция с Telegram ботом

---

**Вопросы?** Смотрите `content-factory-full-spec.md`

