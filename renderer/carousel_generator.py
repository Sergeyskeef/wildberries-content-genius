from PIL import Image, ImageDraw, ImageFont
import textwrap
import os
import json
import zipfile
from datetime import datetime

class CarouselRenderer:
    def __init__(self, theme="dark"):
        self.width = 1080
        self.height = 1350
        self.theme = theme
        self.themes = {
            "dark": {"bg": "#1a1a1a", "text": "#ffffff", "accent": "#ff00ff"},
            "light": {"bg": "#ffffff", "text": "#000000", "accent": "#0000ff"}
        }
        self.colors = self.themes.get(theme, self.themes["dark"])
        # Пути к шрифтам (используем дефолтные, если нет своих)
        self.font_path = "renderer/fonts/Roboto-Bold.ttf" 

    def create_slide(self, slide_data, output_path):
        """Создать один слайд"""
        img = Image.new('RGB', (self.width, self.height), color=self.colors["bg"])
        draw = ImageDraw.Draw(img)
        
        # Загрузка шрифта (нужен файл шрифта, пока используем дефолтный)
        try:
            # Попытка загрузить шрифт, если файла нет - исключение
            font_title = ImageFont.truetype(self.font_path, size=60)
            font_body = ImageFont.truetype(self.font_path, size=40)
        except:
            font_title = ImageFont.load_default()
            font_body = ImageFont.load_default()

        # Заголовок
        title = slide_data.get("headline", "")
        lines = textwrap.wrap(title, width=20)
        y_text = 150
        for line in lines:
            draw.text((100, y_text), line, font=font_title, fill=self.colors["accent"])
            y_text += 70

        # Основной текст
        body = slide_data.get("body_text", "")
        lines = textwrap.wrap(body, width=30)
        y_text += 100
        for line in lines:
            draw.text((100, y_text), line, font=font_body, fill=self.colors["text"])
            y_text += 50
            
        # Номер слайда
        draw.text((self.width - 100, 50), f"{slide_data.get('number')}", font=font_title, fill=self.colors["text"])

        img.save(output_path)
        return output_path

    def generate_carousel(self, plan: dict, output_dir: str):
        """Сгенерировать всю карусель и упаковать в ZIP"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Папка для слайдов
        carousel_id = f"carousel_{int(datetime.now().timestamp())}"
        slides_dir = os.path.join(output_dir, carousel_id)
        os.makedirs(slides_dir, exist_ok=True)
        
        generated_files = []
        
        # Генерация слайдов
        for slide in plan.get("slides", []):
            filename = f"slide_{slide['number']}.png"
            filepath = os.path.join(slides_dir, filename)
            self.create_slide(slide, filepath)
            generated_files.append(filepath)
            
        # Создание ZIP
        zip_filename = f"{carousel_id}.zip"
        zip_path = os.path.join(output_dir, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in generated_files:
                zipf.write(file, os.path.basename(file))
                
        return zip_path

