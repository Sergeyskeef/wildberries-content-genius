from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.init_db import engine, Base
import logging

# Инициализация логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация FastAPI
app = FastAPI(title="Content Factory API", version="1.0.0")

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

@app.post("/api/parse/instagram")
async def parse_instagram(hashtag: str = "wildberries"):
    """Запустить парсинг Instagram по хэштегу"""
    from parser.instagram_parser import InstagramParser
    from database.init_db import SessionLocal
    
    parser = InstagramParser()
    results = parser.parse_hashtag(hashtag, amount=10)
    
    db = SessionLocal()
    try:
        saved_count = parser.save_to_db(db, results)
        return {
            "status": "success", 
            "parsed": len(results), 
            "saved": saved_count,
            "hashtag": hashtag
        }
    finally:
        db.close()


@app.post("/api/analyze")
async def analyze_pending():
    """Проанализировать контент со статусом pending с помощью OpenAI"""
    from database.init_db import SessionLocal
    from database.models import ContentSource
    from analyzer.analyzer import ContentAnalyzer
    
    db = SessionLocal()
    try:
        pending_items = db.query(ContentSource).filter_by(status="pending").limit(5).all()
        if not pending_items:
            return {"status": "ok", "message": "No pending items to analyze"}
            
        analyzer = ContentAnalyzer() # API key from env
        
        analyzed_count = 0
        for item in pending_items:
            score = analyzer.score_content(item)
            item.score = score
            item.status = "scored"
            analyzed_count += 1
            
        db.commit()
        return {"status": "success", "analyzed": analyzed_count}
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return {"status": "error", "detail": str(e)}
    finally:
        db.close()


@app.post("/api/ideas/{id}/approve")
async def approve_idea(id: int):
    """Одобрить идею и запустить генерацию карусели"""
    from database.init_db import SessionLocal
    from database.models import ContentSource, CarouselPlan, Carousel
    from analyzer.analyzer import ContentAnalyzer
    from renderer.carousel_generator import CarouselRenderer
    import os
    
    db = SessionLocal()
    try:
        # 1. Получить идею
        idea = db.query(ContentSource).filter_by(id=id).first()
        if not idea:
            return {"status": "error", "message": "Idea not found"}
            
        idea.status = "approved"
        
        # 2. Сгенерировать план (если еще нет)
        # В реальности лучше проверять, есть ли уже план
        analyzer = ContentAnalyzer()
        plan_data = analyzer.generate_carousel_plan(idea)
        
        if not plan_data:
            return {"status": "error", "message": "Failed to generate plan"}

        # Сохранить план в БД
        plan = CarouselPlan(
            source_id=idea.id,
            title=plan_data.get("title", "Untitled"),
            structure=plan_data,
            status="ready"
        )
        db.add(plan)
        db.commit()
        
        # 3. Рендеринг
        renderer = CarouselRenderer()
        output_dir = os.getenv("OUTPUT_PATH", "./output")
        zip_path = renderer.generate_carousel(plan_data, output_dir)
        
        # Сохранить результат
        carousel = Carousel(
            plan_id=plan.id,
            zip_path=zip_path,
            status="ready"
        )
        db.add(carousel)
        db.commit()
        
        return {"status": "success", "zip_path": zip_path}
        
    except Exception as e:
        logger.error(f"Approval error: {e}")
        return {"status": "error", "detail": str(e)}
    finally:
        db.close()


