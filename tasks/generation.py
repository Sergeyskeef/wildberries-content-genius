from celery_app import celery_app
from database.init_db import SessionLocal
from database.models import ContentSource, CarouselPlan, Carousel
from analyzer.analyzer import ContentAnalyzer
from renderer.carousel_generator import CarouselRenderer
from storage.s3 import S3Storage
from datetime import datetime
import logging
import os
import shutil

logger = logging.getLogger(__name__)

@celery_app.task
def generate_carousel_pipeline(content_source_id: int):
    """
    Полный пайплайн генерации: 
    1. Переработка контента в план (OpenAI)
    2. Рендеринг слайдов (Pillow)
    3. Загрузка в S3 (MinIO)
    """
    db = SessionLocal()
    try:
        source = db.query(ContentSource).filter(ContentSource.id == content_source_id).first()
        if not source:
            return "Source not found"

        # 1. Repurpose
        analyzer = ContentAnalyzer()
        plan_data = analyzer.generate_carousel_plan(source)
        if not plan_data:
            return "Failed to generate plan"

        plan = CarouselPlan(
            source_id=source.id,
            title=plan_data.get("title", "Untitled"),
            structure=plan_data,
            status="ready"
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # 2. Render & Package
        renderer = CarouselRenderer()
        temp_output_dir = f"storage/temp/{plan.id}"
        os.makedirs(temp_output_dir, exist_ok=True)
        
        zip_path = renderer.generate_carousel(plan_data, temp_output_dir)
        
        # 3. Upload to S3
        s3 = S3Storage()
        object_key = f"carousels/carousel_{plan.id}.zip"
        s3.upload_file(zip_path, object_key)
        
        # 4. Save Carousel result
        carousel = Carousel(
            plan_id=plan.id,
            zip_object_key=object_key,
            status="ready"
        )
        db.add(carousel)
        
        # Обновляем статус источника
        source.status = "completed"
        db.commit()

        # Очистка временных файлов
        if os.path.exists(temp_output_dir):
            shutil.rmtree(temp_output_dir)
        if os.path.exists(zip_path):
            os.remove(zip_path)

        return f"Success: Carousel {carousel.id} created"
        
    except Exception as e:
        logger.error(f"Generation pipeline error: {e}")
        return str(e)
    finally:
        db.close()

