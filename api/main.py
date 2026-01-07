from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from database.init_db import engine, Base, SessionLocal
from database.models import PipelineRun
import logging
import os
from datetime import datetime

# Инициализация логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация FastAPI
app = FastAPI(title="Content Factory API", version="1.0.0")

class RunCreate(BaseModel):
    type: str  # discovery, harvest, scoring
    config: Optional[Dict[str, Any]] = None

# Настройка CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "*"  # Для разработки разрешаем все
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Проверка работоспособности сервиса"""
    return {"status": "ok", "service": "Content Factory API"}

@app.post("/api/ideas/{id}/approve")
async def approve_idea(id: int):
    """Одобрить идею и запустить асинхронную генерацию карусели"""
    from tasks.generation import generate_carousel_pipeline
    from database.models import ContentSource
    
    db = SessionLocal()
    try:
        idea = db.query(ContentSource).filter_by(id=id).first()
        if not idea:
            return {"status": "error", "message": "Idea not found"}
            
        idea.status = "approved"
        db.commit()
        
        # Запуск асинхронного пайплайна
        generate_carousel_pipeline.delay(idea.id)
        
        return {"status": "success", "message": "Generation started"}
    finally:
        db.close()

@app.post("/api/runs/start")
async def start_run(run_data: RunCreate):
    """Запустить новый пайплайн (создает запись и ставит задачу в Celery)"""
    from tasks.discovery import discovery_accounts
    from tasks.harvest import harvest_instagram_content
    from tasks.scoring import score_pending
    
    db = SessionLocal()
    try:
        run = PipelineRun(
            type=run_data.type,
            status="pending",
            config_snapshot=run_data.config or {}
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        
        # Запуск задачи в Celery
        if run_data.type == "discovery":
            discovery_accounts.delay(run.id, run_data.config or {})
        elif run_data.type == "harvest":
            harvest_instagram_content.delay(run.id, run_data.config or {})
        elif run_data.type == "scoring":
            score_pending.delay(run.id)
        else:
            run.status = "failed"
            run.error_log = f"Unknown run type: {run_data.type}"
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid run type")
            
        return {"status": "success", "run_id": run.id}
    finally:
        db.close()

@app.get("/api/runs/{run_id}")
async def get_run_status(run_id: int):
    """Получить статус выполнения пайплайна"""
    db = SessionLocal()
    try:
        run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return run
    finally:
        db.close()

@app.get("/api/runs")
async def list_runs(limit: int = 10):
    """Получить список последних запусков"""
    db = SessionLocal()
    try:
        runs = db.query(PipelineRun).order_by(PipelineRun.id.desc()).limit(limit).all()
        return runs
    finally:
        db.close()

@app.get("/api/content")
async def list_content(status: Optional[str] = None, limit: int = 50):
    """Получить список контента (идей)"""
    from database.models import ContentSource
    db = SessionLocal()
    try:
        query = db.query(ContentSource)
        if status:
            query = query.filter(ContentSource.status == status)
        
        items = query.order_by(ContentSource.score.desc().nulls_last()).limit(limit).all()
        return items
    finally:
        db.close()

@app.get("/api/carousels")
async def list_carousels(limit: int = 10):
    """Получить список готовых каруселей"""
    from database.models import Carousel, CarouselPlan
    db = SessionLocal()
    try:
        carousels = db.query(Carousel).join(CarouselPlan).order_by(Carousel.id.desc()).limit(limit).all()
        return carousels
    finally:
        db.close()

@app.get("/api/carousels/{id}/download")
async def get_carousel_download_url(id: int):
    """Получить ссылку для скачивания ZIP из S3"""
    from database.models import Carousel
    from storage.s3 import S3Storage
    db = SessionLocal()
    try:
        carousel = db.query(Carousel).filter(Carousel.id == id).first()
        if not carousel:
            raise HTTPException(status_code=404, detail="Carousel not found")
            
        s3 = S3Storage()
        url = s3.get_presigned_url(carousel.zip_object_key)
        return {"download_url": url}
    finally:
        db.close()


