from openai import OpenAI
import logging
import json
import os
from database.models import ContentSource

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4-turbo-preview" # Or gpt-3.5-turbo if preferred for cost

    def score_content(self, content: ContentSource) -> float:
        """Оценить контент на релевантность (0-100)"""
        try:
            prompt = f"""
Оцени этот контент на релевантность для менеджеров Wildberries и инвесторов в маркетплейсы.
Ответь ТОЛЬКО ЧИСЛО от 0 до 100.

Контент:
Caption: {content.caption[:300] if content.caption else 'No caption'}
Likes: {content.metadata_info.get('likes')}
Views: {content.metadata_info.get('views')}
Author: {content.metadata_info.get('author')}
"""
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10
            )
            
            response_text = response.choices[0].message.content.strip()
            # Пытаемся извлечь число
            import re
            match = re.search(r'\d+', response_text)
            if match:
                score = float(match.group())
                score = min(100, max(0, score))
            else:
                score = 0.0
            
            logger.info(f"✅ Scored content {content.id}: {score}")
            return score
        
        except Exception as e:
            logger.error(f"❌ Scoring error: {e}")
            return 0.0

    def generate_carousel_plan(self, content: ContentSource) -> dict:
        """Создать план карусели на основе контента"""
        try:
            prompt = f"""
Ты эксперт по контенту для Wildberries. Создай структуру карусели для Instagram (8-10 слайдов) на основе этого материала.
Целевая аудитория: селлеры и менеджеры WB.
Тон: экспертный, полезный.

Исходный материал:
{content.caption if content.caption else 'No caption'}

Верни ТОЛЬКО JSON следующей структуры:
{{
  "title": "Заголовок карусели",
  "description": "Описание для поста",
  "slides": [
    {{
      "number": 1,
      "type": "cover",
      "headline": "Текст заголовка на слайде",
      "body_text": "Основной текст слайда (если есть)",
      "visual_hint": "Описание, что должно быть на фоне"
    }},
    ...
  ],
  "cta_final": {{
    "text": "Текст призыва к действию",
    "link": "Ссылка (если есть)"
  }}
}}
"""
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" }
            )
            
            plan = json.loads(response.choices[0].message.content)
            return plan

        except Exception as e:
            logger.error(f"❌ Plan generation error: {e}")
            return None

