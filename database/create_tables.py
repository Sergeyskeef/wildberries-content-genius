from database.init_db import engine, Base
from database.models import ContentSource, Account, CarouselPlan, Carousel
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_tables():
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    init_tables()

