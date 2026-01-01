from instagrapi import Client
import logging
from datetime import datetime
import os
from sqlalchemy.orm import Session
from database.models import ContentSource

logger = logging.getLogger(__name__)

class InstagramParser:
    def __init__(self, username: str = None, password: str = None):
        self.client = Client()
        self.username = username or os.getenv("INSTAGRAM_USERNAME")
        self.password = password or os.getenv("INSTAGRAM_PASSWORD")
        
        if self.username and self.password:
            try:
                self.client.login(self.username, self.password)
                logger.info("✅ Instagram login successful")
            except Exception as e:
                logger.error(f"❌ Instagram login failed: {e}")
                # Продолжаем без логина для публичных данных, если возможно
        else:
            logger.warning("⚠️ No Instagram credentials provided, functionality may be limited")

    def parse_hashtag(self, hashtag: str, amount: int = 20) -> list[dict]:
        """Парсить Reels по хэштегу"""
        logger.info(f"Searching for #{hashtag}...")
        try:
            # Для публичного доступа без логина используем web api или аналог
            # instagrapi требует логин для hashtag_medias_recent обычно
            medias = self.client.hashtag_medias_recent(hashtag, amount=amount)
            
            results = []
            for media in medias:
                # Фильтруем только видео (Reels) или карусели, если нужно
                # media_type: 1=Photo, 2=Video, 8=Album
                if media.media_type in [2, 8]: 
                    data = {
                        "url": f"https://instagram.com/p/{media.pk}/",
                        "platform": "instagram",
                        "caption": media.caption_text or "",
                        "likes": media.like_count,
                        "comments": media.comment_count,
                        "views": getattr(media, 'play_count', 0), # play_count может не быть
                        "author": media.user.username,
                        "author_followers": 0, # Нужно отдельным запросом, если критично
                        "type": "reel" if media.media_type == 2 else "carousel",
                        "video_url": str(media.video_url) if media.video_url else None,
                        "thumbnail_url": str(media.thumbnail_url) if media.thumbnail_url else None,
                    }
                    results.append(data)
            
            logger.info(f"✅ Parsed {len(results)} posts from #{hashtag}")
            return results
        
        except Exception as e:
            logger.error(f"❌ Parsing error: {e}")
            return []

    def save_to_db(self, db: Session, parsed_data: list[dict]):
        """Сохраняет контент в БД"""
        count = 0
        for item in parsed_data:
            existing = db.query(ContentSource).filter_by(url=item["url"]).first()
            if existing:
                continue
            
            source = ContentSource(
                url=item["url"],
                platform=item["platform"],
                caption=item["caption"],
                metadata_info=item,  # JSON
                status="pending",
            )
            db.add(source)
            count += 1
        
        try:
            db.commit()
            logger.info(f"💾 Saved {count} new items to DB")
            return count
        except Exception as e:
            logger.error(f"❌ DB Save error: {e}")
            db.rollback()
            return 0

