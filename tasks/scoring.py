from celery_app import celery_app
from database.init_db import SessionLocal
from database.models import PipelineRun, ContentSource
from analyzer.analyzer import ContentAnalyzer
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def score_pending(run_id: int):
    db = SessionLocal()
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        return "Run not found"

    run.status = "running"
    run.started_at = datetime.utcnow()
    db.commit()

    try:
        analyzer = ContentAnalyzer()
        
        # Получаем контент со статусом pending
        pending_items = db.query(ContentSource).filter(ContentSource.status == "pending").limit(50).all()
        
        scored_count = 0
        for item in pending_items:
            try:
                score = analyzer.score_content(item)
                item.score = score
                item.status = "scored"
                scored_count += 1
            except Exception as e:
                logger.error(f"Error scoring item {item.id}: {e}")

        db.commit()
        
        run.status = "completed"
        run.stats = {"scored": scored_count}
        run.finished_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.error(f"Scoring task error: {e}")
        run.status = "failed"
        run.error_log = str(e)
        run.finished_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

