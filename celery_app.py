import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "content_factory",
    broker=redis_url,
    backend=redis_url,
    include=["tasks.ping", "tasks.discovery", "tasks.harvest", "tasks.scoring", "tasks.generation"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "ping-every-1-minute": {
            "task": "tasks.ping.ping",
            "schedule": 60.0,
        },
    },
)

if __name__ == "__main__":
    celery_app.start()

