import os
import logging
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class ApifyWrapper:
    def __init__(self):
        self.api_key = os.getenv("APIFY_API_TOKEN") or os.getenv("APIFY_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ APIFY_API_TOKEN not found in environment")
        self.client = ApifyClient(self.api_key)

    def run_actor_sync(self, actor_id: str, input_data: dict, timeout_secs: int = 300):
        """
        Запуск актора синхронно (ждём завершения). 
        Ограничение Apify API для синхронных вызовов - 300 сек.
        """
        try:
            logger.info(f"🚀 Running actor {actor_id} (sync)...")
            run = self.client.actor(actor_id).call(run_input=input_data, timeout_secs=timeout_secs)
            if not run:
                return None
            
            # Получаем результаты из датасета
            dataset_id = run.get("defaultDatasetId")
            items = self.client.dataset(dataset_id).list_items().items
            logger.info(f"✅ Actor {actor_id} finished, found {len(items)} items")
            return items
        except Exception as e:
            logger.error(f"❌ Apify sync run error: {e}")
            return None

    def run_actor_async(self, actor_id: str, input_data: dict):
        """
        Запуск актора асинхронно. Возвращает run_id.
        """
        try:
            logger.info(f"🚀 Running actor {actor_id} (async)...")
            run = self.client.actor(actor_id).start(run_input=input_data)
            return run.get("id")
        except Exception as e:
            logger.error(f"❌ Apify async start error: {e}")
            return None

    def get_run_status(self, run_id: str):
        try:
            run = self.client.run(run_id).get()
            return run.get("status")
        except Exception as e:
            logger.error(f"❌ Apify get status error: {e}")
            return "FAILED"

    def get_dataset_items(self, dataset_id: str):
        try:
            return self.client.dataset(dataset_id).list_items().items
        except Exception as e:
            logger.error(f"❌ Apify get dataset error: {e}")
            return []

