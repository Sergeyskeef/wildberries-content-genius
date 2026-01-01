from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from database.init_db import Base

class ContentSource(Base):
    """Спарсенный контент (Instagram, YouTube, TikTok)"""
    __tablename__ = "content_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), unique=True, nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # instagram, youtube, tiktok
    caption = Column(Text, nullable=True)
    metadata_info = Column(JSON, nullable=True)  # {views, likes, comments, author, ...} renamed to avoid conflict
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

