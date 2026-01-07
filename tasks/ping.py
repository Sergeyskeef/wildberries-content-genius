from celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def ping():
    logger.info("Pong!")
    return "pong"

