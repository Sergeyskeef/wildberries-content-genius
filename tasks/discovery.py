from celery_app import celery_app
from integrations.apify.client import ApifyWrapper
from database.init_db import SessionLocal
from database.models import PipelineRun, Account
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def discovery_accounts(run_id: int, config: dict):
    db = SessionLocal()
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        return "Run not found"

    run.status = "running"
    run.started_at = datetime.utcnow()
    db.commit()

    try:
        apify = ApifyWrapper()
        
        # Конфигурация для Instagram Search Scraper (например, apify/instagram-search-scraper)
        # В реальности нужно использовать правильный ID актора
        actor_id = config.get("actor_id", "apify/instagram-search-scraper")
        search_queries = config.get("queries", ["wildberries", "бизнес на вб"])
        
        all_results = []
        for query in search_queries:
            input_data = {
                "search": query,
                "searchType": "user",
                "resultsLimit": config.get("limit_per_query", 10)
            }
            results = apify.run_actor_sync(actor_id, input_data)
            if results:
                all_results.extend(results)

        saved_count = 0
        for item in all_results:
            # Маппинг данных из Apify в модель Account
            username = item.get("username")
            if not username: continue
            
            existing = db.query(Account).filter(Account.username == username).first()
            if not existing:
                account = Account(
                    username=username,
                    platform="instagram",
                    followers=item.get("followersCount"),
                    category="candidate",
                    is_active=True
                )
                db.add(account)
                saved_count += 1
        
        db.commit()
        
        run.status = "completed"
        run.stats = {"found": len(all_results), "saved": saved_count}
        run.finished_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.error(f"Discovery task error: {e}")
        run.status = "failed"
        run.error_log = str(e)
        run.finished_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

