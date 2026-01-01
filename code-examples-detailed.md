# Content Factory: ПРИМЕРЫ КОДА И ДЕМОНСТРАЦИЯ
## Готовые фрагменты для быстрого старта

---

## 📝 ОГЛАВЛЕНИЕ

1. Основные модели (Pydantic + SQLAlchemy)
2. API endpoints (FastAPI)
3. Парсеры (Instagram, YouTube)
4. LLM интеграция (Claude)
5. Rendering (PIL/Pillow)
6. Docker setup

---

## 1️⃣ PYDANTIC MODELS (api/schemas.py)

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ========== REQUEST MODELS ==========

class ParseInstagramRequest(BaseModel):
    hashtag: str = Field(..., description="Instagram hashtag without #")
    amount: int = Field(50, ge=10, le=500, description="Number of posts to parse")
    
    class Config:
        json_schema_extra = {
            "example": {
                "hashtag": "валберриз",
                "amount": 50
            }
        }

class ApproveIdeaRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Why you approved this idea")

class GenerateCarouselRequest(BaseModel):
    idea_id: int
    theme: str = Field("dark", pattern="^(dark|light|minimal)$")
    slides_count: int = Field(10, ge=8, le=12)

# ========== RESPONSE MODELS ==========

class ContentSourceResponse(BaseModel):
    id: int
    url: str
    platform: str
    caption: str
    score: Optional[float] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CarouselSlideResponse(BaseModel):
    number: int
    type: str  # "cover", "content", "cta"
    headline: str
    body_text: str
    visual_hint: Optional[str] = None
    cta: Optional[str] = None

class CarouselPlanResponse(BaseModel):
    id: int
    title: str
    description: str
    slides: List[CarouselSlideResponse]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class IdeasListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    ideas: List[ContentSourceResponse]

class StatsResponse(BaseModel):
    total_contents: int
    pending: int
    scored: int
    approved: int
    carousels_created: int
    last_parse_at: Optional[datetime] = None
```

---

## 2️⃣ SQLALCHEMY MODELS (database/models.py)

```python
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, Boolean, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class ContentSource(Base):
    """Спарсенный контент (Instagram, YouTube, TikTok)"""
    __tablename__ = "content_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), unique=True, nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # instagram, youtube, tiktok
    caption = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # {views, likes, comments, author, ...}
    status = Column(String(50), default="pending", index=True)  # pending, scored, approved, archived
    score = Column(Float, nullable=True, index=True)  # 0-100
    
    # Relations
    carousel_plans = relationship("CarouselPlan", back_populates="source")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_platform_status_score', 'platform', 'status', 'score'),
        Index('idx_status_score', 'status', 'score'),
    )

class Account(Base):
    """Конкурентские аккаунты для парсинга"""
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)  # instagram, youtube, tiktok
    username = Column(String(255), nullable=False, index=True)
    followers = Column(Integer, nullable=True)
    category = Column(String(100))  # конкурент, партнер, эксперт
    is_active = Column(Boolean, default=True, index=True)
    last_parsed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CarouselPlan(Base):
    """Структурированный план карусели"""
    __tablename__ = "carousel_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("content_sources.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    structure = Column(JSON, nullable=False)  # {slides: [...], cta_final: {...}}
    status = Column(String(50), default="draft", index=True)  # draft, ready, published
    theme = Column(String(50), default="dark")  # dark, light, minimal
    
    # Relations
    source = relationship("ContentSource", back_populates="carousel_plans")
    carousel = relationship("Carousel", back_populates="plan", uselist=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Carousel(Base):
    """Готовая карусель (ZIP файл)"""
    __tablename__ = "carousels"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("carousel_plans.id"), nullable=False)
    zip_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    status = Column(String(50), default="ready", index=True)  # ready, published
    published_at = Column(DateTime, nullable=True)
    
    # Relations
    plan = relationship("CarouselPlan", back_populates="carousel")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrendingTopic(Base):
    """Отслеживаемые тренды"""
    __tablename__ = "trending_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False, index=True)
    platform = Column(String(50), nullable=False)
    search_volume = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_checked_at = Column(DateTime, nullable=True)
```

---

## 3️⃣ FASTAPI ROUTES (api/routes/ideas.py)

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database.models import ContentSource, CarouselPlan
from database.crud import get_db
from api.schemas import ContentSourceResponse, IdeasListResponse, ApproveIdeaRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ideas", tags=["ideas"])

# ========== GET ENDPOINTS ==========

@router.get("", response_model=IdeasListResponse)
async def get_ideas(
    status: str = Query("approved", description="Filter by status"),
    min_score: float = Query(75, ge=0, le=100),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=5, le=100),
    db: Session = Depends(get_db)
):
    """
    Получить список идей для создания каруселей.
    
    Фильтры:
    - status: pending, scored, approved, archived
    - min_score: минимальный score (0-100)
    - page: номер страницы
    - per_page: количество результатов на странице
    """
    try:
        # Основной запрос
        query = db.query(ContentSource).filter(
            ContentSource.status == status,
            ContentSource.score >= min_score
        ).order_by(ContentSource.score.desc())
        
        # Пагинация
        total = query.count()
        offset = (page - 1) * per_page
        ideas = query.offset(offset).limit(per_page).all()
        
        return IdeasListResponse(
            total=total,
            page=page,
            per_page=per_page,
            ideas=[ContentSourceResponse.model_validate(idea) for idea in ideas]
        )
    
    except Exception as e:
        logger.error(f"❌ Error fetching ideas: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{idea_id}", response_model=ContentSourceResponse)
async def get_idea(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """Получить одну идею по ID"""
    idea = db.query(ContentSource).filter_by(id=idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return ContentSourceResponse.model_validate(idea)

@router.get("/{idea_id}/carousel", response_model=dict)
async def get_idea_carousel(
    idea_id: int,
    db: Session = Depends(get_db)
):
    """Получить карусель, созданную из этой идеи"""
    plan = db.query(CarouselPlan).filter_by(source_id=idea_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No carousel for this idea yet")
    
    return {
        "plan_id": plan.id,
        "title": plan.title,
        "slides_count": len(plan.structure.get("slides", [])),
        "status": plan.status,
        "created_at": plan.created_at
    }

# ========== POST ENDPOINTS ==========

@router.post("/{idea_id}/approve", response_model=dict)
async def approve_idea(
    idea_id: int,
    request: ApproveIdeaRequest,
    db: Session = Depends(get_db)
):
    """Одобрить идею"""
    idea = db.query(ContentSource).filter_by(id=idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    idea.status = "approved"
    db.commit()
    
    logger.info(f"✅ Approved idea {idea_id}: {request.reason}")
    return {
        "status": "success",
        "idea_id": idea_id,
        "message": "Idea approved. Ready for carousel creation."
    }

@router.post("/{idea_id}/reject", response_model=dict)
async def reject_idea(
    idea_id: int,
    request: ApproveIdeaRequest,
    db: Session = Depends(get_db)
):
    """Отклонить идею"""
    idea = db.query(ContentSource).filter_by(id=idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    idea.status = "archived"
    db.commit()
    
    logger.info(f"❌ Rejected idea {idea_id}: {request.reason}")
    return {
        "status": "success",
        "idea_id": idea_id,
        "message": "Idea archived."
    }
```

---

## 4️⃣ INSTAGRAM PARSER (parser/instagram_parser.py)

```python
from instagrapi import Client
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class InstagramParserError(Exception):
    """Custom exception для Instagram парсера"""
    pass

class InstagramParser:
    def __init__(self, username: str, password: str, proxy: str = None):
        self.username = username
        self.password = password
        self.proxy = proxy
        self.client = None
        self._authenticate()
    
    def _authenticate(self):
        """Аутентифицироваться в Instagram"""
        try:
            self.client = Client()
            if self.proxy:
                self.client.proxy = self.proxy
            
            self.client.login(username=self.username, password=self.password)
            logger.info(f"✅ Instagram authenticated as {self.username}")
        
        except Exception as e:
            logger.error(f"❌ Instagram auth failed: {e}")
            raise InstagramParserError(f"Authentication failed: {e}")
    
    def parse_hashtag(self, hashtag: str, amount: int = 50) -> list[dict]:
        """Парсить Reels и Carousel по хэштегу"""
        try:
            # Очистить hashtag
            hashtag = hashtag.strip("#").lower()
            
            logger.info(f"🔄 Parsing #{hashtag} ({amount} posts)...")
            
            # Получить медиа
            medias = self.client.hashtag_medias_recent(hashtag, amount=amount)
            
            results = []
            for media in medias:
                try:
                    # Только видео (Reels и видео в Carousel)
                    if media.media_type == 2:  # VIDEO
                        data = {
                            "url": f"https://instagram.com/p/{media.pk}/",
                            "platform": "instagram",
                            "caption": media.caption_text or "",
                            "likes": media.like_count or 0,
                            "comments": media.comments_count or 0,
                            "views": media.play_count or 0,
                            "author": media.user.username,
                            "author_followers": media.user.follower_count or 0,
                            "media_type": "reel",
                            "video_url": media.video_url,
                            "thumbnail_url": media.thumbnail_url,
                            "published_at": media.taken_at.isoformat() if media.taken_at else None,
                        }
                        results.append(data)
                
                except Exception as e:
                    logger.warning(f"⚠️ Error parsing media {media.pk}: {e}")
                    continue
            
            logger.info(f"✅ Successfully parsed {len(results)} posts from #{hashtag}")
            return results
        
        except Exception as e:
            logger.error(f"❌ Error parsing hashtag {hashtag}: {e}")
            raise InstagramParserError(f"Failed to parse hashtag: {e}")
    
    def parse_accounts(self, accounts: list[str]) -> list[dict]:
        """Парсить недавние посты с конкретных аккаунтов"""
        results = []
        
        for account in accounts:
            try:
                logger.info(f"🔄 Parsing account @{account}...")
                
                user_id = self.client.user_id_from_username(account)
                medias = self.client.user_medias_paginated(user_id, 10)
                
                for media in medias:
                    if media.media_type == 2:  # только видео
                        data = {
                            "url": f"https://instagram.com/p/{media.pk}/",
                            "platform": "instagram",
                            "caption": media.caption_text or "",
                            "likes": media.like_count or 0,
                            "comments": media.comments_count or 0,
                            "views": media.play_count or 0,
                            "author": account,
                            "author_followers": media.user.follower_count or 0,
                            "media_type": "reel",
                            "video_url": media.video_url,
                            "thumbnail_url": media.thumbnail_url,
                            "published_at": media.taken_at.isoformat() if media.taken_at else None,
                        }
                        results.append(data)
                
                logger.info(f"✅ Parsed {len([m for m in results if m['author'] == account])} posts from @{account}")
            
            except Exception as e:
                logger.warning(f"⚠️ Error parsing account @{account}: {e}")
                continue
        
        return results
    
    def get_top_reels(self, hashtags: list[str], amount_per_hashtag: int = 20) -> list[dict]:
        """Получить топовые Reels по нескольким хэштегам"""
        all_results = []
        
        for hashtag in hashtags:
            try:
                results = self.parse_hashtag(hashtag, amount=amount_per_hashtag)
                all_results.extend(results)
            except Exception as e:
                logger.warning(f"⚠️ Error with hashtag {hashtag}: {e}")
                continue
        
        # Сортировать по engagement (views + likes + comments)
        all_results.sort(
            key=lambda x: x['views'] + x['likes'] + x['comments'],
            reverse=True
        )
        
        return all_results
```

---

## 5️⃣ LLM ANALYZER (analyzer/llm_analyzer.py)

```python
from anthropic import Anthropic
import json
import logging
import re

logger = logging.getLogger(__name__)

class LLMAnalyzerError(Exception):
    pass

class ContentAnalyzer:
    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        self.client = Anthropic(api_key=api_key)
        self.model = model
    
    def score_content(self, content_caption: str, metadata: dict) -> float:
        """
        Оценить контент на релевантность для WB нише (0-100)
        """
        try:
            prompt = f"""
Оцени этот контент на релевантность для менеджеров Wildberries, инвесторов в маркетплейсы и резелеров.

Критерии оценки:
1. Релевантность для WB/e-commerce нише (25 баллов)
2. Вирусность и engagement (25 баллов)
3. Применимость для переработки в карусель (25 баллов)
4. Оригинальность и уникальность (25 баллов)

Контент:
Caption: {content_caption[:500]}
Views: {metadata.get('views', 0)}
Likes: {metadata.get('likes', 0)}
Comments: {metadata.get('comments', 0)}
Author followers: {metadata.get('author_followers', 0)}

ОТВЕТЬ ТОЛЬКО ЧИСЛО от 0 до 100, без объяснений.
"""
            
            message = self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Парсить число из ответа
            response_text = message.content[0].text.strip()
            
            # Извлечь первое число из ответа
            numbers = re.findall(r'\d+', response_text)
            if numbers:
                score = float(numbers[0])
            else:
                score = 0.0
            
            score = min(100, max(0, score))
            
            logger.info(f"✅ Scored content: {score}")
            return score
        
        except Exception as e:
            logger.error(f"❌ Scoring error: {e}")
            raise LLMAnalyzerError(f"Failed to score content: {e}")
    
    def extract_key_ideas(self, caption: str) -> list[str]:
        """Извлечь 3-5 ключевых идей из контента"""
        try:
            prompt = f"""
Извлеки 3-5 ключевых идей/инсайтов из этого контента.
Игнорируй флаф, оставь суть.

Контент:
{caption[:1000]}

ОТВЕТЬ ТОЛЬКО список идей, по одной в строке (без нумерации):
"""
            
            message = self.client.messages.create(
                model=self.model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            ideas = [
                line.strip() 
                for line in message.content[0].text.split('\n') 
                if line.strip() and not line.strip().startswith('•')
            ]
            
            logger.info(f"✅ Extracted {len(ideas)} ideas")
            return ideas[:5]
        
        except Exception as e:
            logger.error(f"❌ Idea extraction error: {e}")
            raise LLMAnalyzerError(f"Failed to extract ideas: {e}")
    
    def generate_carousel_plan(self, caption: str, ideas: list[str]) -> dict:
        """Переработать контент и создать структуру карусели"""
        try:
            prompt = f"""
Ты эксперт контент-маркетинга. На основе этих идей создай структуру карусели для Instagram.

АУДИТОРИЯ:
- Менеджеры на Wildberries (ведут бизнес "под ключ" для инвесторов)
- Инвесторы в маркетплейсы
- Резелеры и новички в e-commerce

ЗАДАЧА:
1. Переосмысли идеи для этой аудитории
2. Добавь примеры из реальности Wildberries
3. Измени тон на профессиональный, но доступный
4. Создай 8-10 слайдов (1 слайд = 1 идея)

ИДЕИ:
{chr(10).join(f'• {idea}' for idea in ideas)}

ВЫХОДНОЙ ФОРМАТ (ТОЛЬКО JSON, БЕЗ КОММЕНТАРИЕВ):
{{
  "title": "название карусели (5-7 слов)",
  "description": "краткое описание (1 предложение)",
  "slides": [
    {{
      "number": 1,
      "type": "cover",
      "headline": "привлекательный заголовок",
      "body_text": "основной текст (2-3 строки)",
      "visual_hint": "подсказка что визуализировать"
    }},
    {{ "number": 2, ... }},
    ...
  ],
  "cta_final": {{
    "text": "финальный призыв к действию",
    "link": null
  }}
}}

Важно:
- Каждый слайд максимум 2-3 строки текста
- Слайд 1 - обложка (привлеки внимание)
- Слайд N - CTA (призыв действия)
- Примеры из WB (категории, ценовые диапазоны, стратегии)
"""
            
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Парсить JSON
            response_text = message.content[0].text
            
            # Очистить от возможных markdown блоков
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]
            
            carousel_plan = json.loads(response_text.strip())
            
            logger.info(f"✅ Generated carousel plan: {carousel_plan['title']}")
            return carousel_plan
        
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            raise LLMAnalyzerError(f"Invalid JSON response: {e}")
        except Exception as e:
            logger.error(f"❌ Carousel generation error: {e}")
            raise LLMAnalyzerError(f"Failed to generate carousel: {e}")
```

---

## 6️⃣ CAROUSEL RENDERER (renderer/carousel_generator.py)

```python
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from typing import Dict, List
import json
import textwrap
import logging
import zipfile

logger = logging.getLogger(__name__)

class CarouselGenerator:
    # Стандартные размеры Instagram карусели
    CAROUSEL_WIDTH = 1080
    CAROUSEL_HEIGHT = 1350
    
    # Темы дизайна
    THEMES = {
        "dark": {
            "bg": "#0f172a",
            "text_primary": "#ffffff",
            "text_secondary": "#94a3b8",
            "accent": "#3b82f6",
            "border": "#1e293b",
        },
        "light": {
            "bg": "#ffffff",
            "text_primary": "#0f172a",
            "text_secondary": "#64748b",
            "accent": "#2563eb",
            "border": "#e2e8f0",
        },
    }
    
    def __init__(self, theme: str = "dark", fonts_path: str = "renderer/fonts"):
        self.theme = theme
        self.colors = self.THEMES.get(theme, self.THEMES["dark"])
        self.fonts_path = Path(fonts_path)
        self.fonts = self._load_fonts()
    
    def _load_fonts(self) -> Dict[str, ImageFont.FreeTypeFont]:
        """Загрузить шрифты"""
        fonts = {}
        font_files = {
            "title": ("Roboto-Bold.ttf", 64),
            "headline": ("Roboto-Bold.ttf", 48),
            "body": ("Roboto-Regular.ttf", 32),
            "small": ("Roboto-Regular.ttf", 24),
        }
        
        for name, (file, size) in font_files.items():
            path = self.fonts_path / file
            try:
                fonts[name] = ImageFont.truetype(str(path), size)
            except Exception as e:
                logger.warning(f"⚠️ Font not found {file}, using default")
                fonts[name] = ImageFont.load_default()
        
        return fonts
    
    def hex_to_rgb(self, hex_color: str) -> tuple:
        """Конвертировать hex цвет в RGB"""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def generate_slide(self, slide_data: dict) -> Image.Image:
        """Создать один слайд (PNG)"""
        
        # Создать изображение
        img = Image.new(
            'RGB',
            (self.CAROUSEL_WIDTH, self.CAROUSEL_HEIGHT),
            self.hex_to_rgb(self.colors["bg"])
        )
        draw = ImageDraw.Draw(img)
        
        # Номер слайда в углу (10pt, серый)
        slide_num = f"{slide_data['number']}/10"
        draw.text(
            (30, 30),
            slide_num,
            fill=self.hex_to_rgb(self.colors["text_secondary"]),
            font=self.fonts["small"]
        )
        
        # Заголовок (headline)
        headline = slide_data.get("headline", "")
        wrapped_headline = textwrap.fill(headline, width=20)
        draw.text(
            (60, 150),
            wrapped_headline,
            fill=self.hex_to_rgb(self.colors["accent"]),
            font=self.fonts["headline"]
        )
        
        # Основной текст (body_text)
        body_text = slide_data.get("body_text", "")
        wrapped_body = textwrap.fill(body_text, width=30)
        draw.text(
            (60, 450),
            wrapped_body,
            fill=self.hex_to_rgb(self.colors["text_primary"]),
            font=self.fonts["body"]
        )
        
        # CTA кнопка (если есть)
        if slide_data.get("cta"):
            button_height = 80
            button_y = self.CAROUSEL_HEIGHT - button_height - 50
            
            # Прямоугольник кнопки
            draw.rectangle(
                [(60, button_y), (self.CAROUSEL_WIDTH - 60, button_y + button_height)],
                outline=self.hex_to_rgb(self.colors["accent"]),
                width=3
            )
            
            # Текст на кнопке
            cta_text = slide_data["cta"]
            draw.text(
                (80, button_y + 25),
                cta_text,
                fill=self.hex_to_rgb(self.colors["accent"]),
                font=self.fonts["body"]
            )
        
        return img
    
    def generate_carousel(self, carousel_plan: dict, output_dir: Path) -> Path:
        """Создать всю карусель (все слайды + ZIP)"""
        
        # Создать уникальное имя папки
        carousel_id = carousel_plan.get("title", "carousel").replace(" ", "_").lower()
        carousel_dir = output_dir / carousel_id
        carousel_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"🔄 Generating carousel: {carousel_plan['title']}")
        
        # Генерировать каждый слайд
        for slide_data in carousel_plan["slides"]:
            img = self.generate_slide(slide_data)
            
            slide_num = slide_data["number"]
            slide_type = slide_data.get("type", "content")
            slide_filename = f"slide_{slide_num:02d}_{slide_type}.png"
            
            img.save(carousel_dir / slide_filename)
            logger.info(f"  ✅ Slide {slide_num} created")
        
        # Сохранить метаданные
        metadata = {
            "title": carousel_plan["title"],
            "description": carousel_plan["description"],
            "slides_count": len(carousel_plan["slides"]),
            "hashtags": ["#валберриз", "#маркетплейс", "#продажи", "#wildberries"],
            "theme": self.theme,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        with open(carousel_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        logger.info(f"  ✅ Metadata saved")
        
        # Создать ZIP файл
        zip_path = output_dir / f"{carousel_id}.zip"
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in carousel_dir.glob("*"):
                if file.is_file():
                    zipf.write(file, arcname=file.name)
        
        logger.info(f"✅ Carousel ZIP created: {zip_path}")
        
        return zip_path

# Usage:
# generator = CarouselGenerator(theme="dark")
# zip_path = generator.generate_carousel(carousel_plan, Path("output/carousels"))
```

---

## 7️⃣ DOCKER SETUP (docker-compose.yml)

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: content_factory_db
    environment:
      POSTGRES_DB: ${DB_NAME:-content_factory}
      POSTGRES_USER: ${DB_USER:-cf_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-cf_secure_pass}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - content-factory-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-cf_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Application
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: content_factory_api
    environment:
      DATABASE_URL: postgresql://${DB_USER:-cf_user}:${DB_PASSWORD:-cf_secure_pass}@postgres:5432/${DB_NAME:-content_factory}
      CLAUDE_API_KEY: ${CLAUDE_API_KEY}
      YOUTUBE_API_KEY: ${YOUTUBE_API_KEY}
      INSTAGRAM_USERNAME: ${INSTAGRAM_USERNAME}
      INSTAGRAM_PASSWORD: ${INSTAGRAM_PASSWORD}
      API_PORT: 8000
    ports:
      - "8000:8000"
    volumes:
      - ./storage:/app/storage
      - ./output:/app/output
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - content-factory-network
    command: uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

  # Nginx Reverse Proxy (optional)
  nginx:
    image: nginx:alpine
    container_name: content_factory_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
    networks:
      - content-factory-network

volumes:
  postgres_data:

networks:
  content-factory-network:
    driver: bridge
```

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Create directories
RUN mkdir -p storage/{videos,thumbnails,temp} output/carousels logs

# Run migrations
RUN python -c "from database.init_db import Base, engine; Base.metadata.create_all(bind=engine)"

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## ✅ ИТОГО

Вы имеете:

1. **Complete Pydantic Schemas** — для валидации данных
2. **SQLAlchemy Models** — для работы с БД
3. **FastAPI Routes** — готовые endpoints
4. **Instagram Parser** — парсит реальные посты
5. **LLM Analyzer** — анализирует через Claude
6. **Carousel Renderer** — генерирует PNG слайды
7. **Docker Setup** — для быстрого развертывания

**Все готово к запуску! 🚀**

