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
            "dark": {
                "bg_start": "#1a1a1a", 
                "bg_end": "#2d0b31", # Темно-фиолетовый градиент в стиле WB
                "text": "#ffffff", 
                "accent": "#cb11ab", # Розовый WB
                "muted": "#a0a0a0"
            },
            "light": {
                "bg_start": "#ffffff", 
                "bg_end": "#f0f0f0", 
                "text": "#000000", 
                "accent": "#cb11ab",
                "muted": "#666666"
            }
        }
        self.colors = self.themes.get(theme, self.themes["dark"])
        # Пути к системным шрифтам с поддержкой кириллицы
        self.font_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        self.font_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

    def _draw_gradient(self, draw):
        """Рисует мягкий градиент на фоне"""
        for i in range(self.height):
            # Интерполяция цвета от bg_start до bg_end
            r1, g1, b1 = self._hex_to_rgb(self.colors["bg_start"])
            r2, g2, b2 = self._hex_to_rgb(self.colors["bg_end"])
            
            r = int(r1 + (r2 - r1) * (i / self.height))
            g = int(g1 + (g2 - g1) * (i / self.height))
            b = int(b1 + (b2 - b1) * (i / self.height))
            
            draw.line([(0, i), (self.width, i)], fill=(r, g, b))

    def _hex_to_rgb(self, hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def create_slide(self, slide_data, output_path):
        """Создать один стильный слайд"""
        img = Image.new('RGB', (self.width, self.height))
        draw = ImageDraw.Draw(img)
        
        # 1. Фон
        self._draw_gradient(draw)
        
        # 2. Шрифты
        try:
            font_h1 = ImageFont.truetype(self.font_bold, size=80)
            font_h2 = ImageFont.truetype(self.font_bold, size=60)
            font_body = ImageFont.truetype(self.font_regular, size=45)
            font_footer = ImageFont.truetype(self.font_regular, size=30)
        except:
            font_h1 = font_h2 = font_body = font_footer = ImageFont.load_default()

        margin = 100
        content_width = self.width - 2 * margin

        # 3. Декор (полоска сверху)
        draw.rectangle([margin, 50, margin + 150, 60], fill=self.colors["accent"])

        # 4. Заголовок (Headline)
        headline = slide_data.get("headline", "").upper()
        if headline:
            wrapped_h1 = textwrap.wrap(headline, width=18)
            y_text = 150
            for line in wrapped_h1:
                draw.text((margin, y_text), line, font=font_h1, fill=self.colors["text"])
                y_text += 100
        else:
            y_text = 150

        # 5. Основной текст (Body)
        body = slide_data.get("body_text", "")
        if body:
            y_text += 50
            # Рисуем разделитель
            draw.line([margin, y_text, margin + 100, y_text], fill=self.colors["accent"], width=3)
            y_text += 50
            
            wrapped_body = textwrap.wrap(body, width=35)
            for line in wrapped_body:
                draw.text((margin, y_text), line, font=font_body, fill=self.colors["text"])
                y_text += 60
            
        # 6. Футер
        # Номер слайда
        slide_num = f"{slide_data.get('number', 1)}"
        draw.text((self.width - margin - 50, self.height - margin), slide_num, font=font_h2, fill=self.colors["accent"])
        
        # Брендинг
        draw.text((margin, self.height - margin), "CONTENT FACTORY | WILDBERRIES", font=font_footer, fill=self.colors["muted"])

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

