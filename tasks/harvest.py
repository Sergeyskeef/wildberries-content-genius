from celery_app import celery_app
from integrations.apify.client import ApifyWrapper
from database.init_db import SessionLocal
from database.models import PipelineRun, Account, ContentSource
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def harvest_instagram_content(run_id: int, config: dict):
    db = SessionLocal()
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        return "Run not found"

    run.status = "running"
    run.started_at = datetime.utcnow()
    db.commit()

    try:
        apify = ApifyWrapper()
        
        # Берем топ аккаунтов для парсинга
        accounts = db.query(Account).filter(Account.is_active == True).limit(config.get("accounts_limit", 5)).all()
        if not accounts:
            run.status = "completed"
            run.stats = {"message": "No active accounts to harvest"}
            run.finished_at = datetime.utcnow()
            db.commit()
            return

        usernames = [acc.username for acc in accounts]
        
        # Конфигурация для Instagram Scraper (например, apify/instagram-scraper)
        actor_id = config.get("actor_id", "apify/instagram-scraper")
        input_data = {
            "directUrls": [f"https://www.instagram.com/{u}/" for u in usernames],
            "resultsLimit": config.get("posts_per_profile", 10),
            "resultsType": "posts"
        }
        
        results = apify.run_actor_sync(actor_id, input_data)
        
        saved_count = 0
        if results:
            for item in results:
                url = item.get("url")
                if not url: continue
                
                existing = db.query(ContentSource).filter(ContentSource.url == url).first()
                if not existing:
                    source = ContentSource(
                        url=url,
                        platform="instagram",
                        caption=item.get("caption", ""),
                        metadata_info=item,
                        status="pending"
                    )
                    db.add(source)
                    saved_count += 1
            
            db.commit()
            
            # Обновляем время последнего парсинга у аккаунтов
            for acc in accounts:
                acc.last_parsed_at = datetime.utcnow()
            db.commit()

        run.status = "completed"
        run.stats = {"found": len(results) if results else 0, "saved": saved_count}
        run.finished_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.error(f"Harvest task error: {e}")
        run.status = "failed"
        run.error_log = str(e)
        run.finished_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

