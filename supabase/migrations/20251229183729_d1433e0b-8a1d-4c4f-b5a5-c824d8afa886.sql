-- Таблица источников контента
CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('web', 'youtube', 'telegram', 'instagram')),
  url TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица собранного контента
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'youtube', 'telegram', 'instagram')),
  original_url TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2),
  virality_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'used', 'archived')),
  tags TEXT[],
  category TEXT,
  metadata JSONB DEFAULT '{}',
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица сгенерированных постов
CREATE TABLE public.generated_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('advice', 'case', 'trend', 'motivation', 'education')),
  caption TEXT,
  slides JSONB DEFAULT '[]',
  slide_images TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица профиля эксперта
CREATE TABLE public.expert_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Наташа',
  description TEXT,
  tone_of_voice TEXT,
  topics TEXT[] DEFAULT ARRAY['Wildberries', 'Селлеры', 'Маркетплейс'],
  forbidden_words TEXT[],
  example_posts JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаём функцию обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_posts_updated_at
  BEFORE UPDATE ON public.generated_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expert_profile_updated_at
  BEFORE UPDATE ON public.expert_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы для быстрого поиска
CREATE INDEX idx_content_items_virality ON public.content_items(virality_score DESC);
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_items_source_type ON public.content_items(source_type);
CREATE INDEX idx_generated_posts_status ON public.generated_posts(status);

-- Вставляем начальный профиль эксперта
INSERT INTO public.expert_profile (name, description, tone_of_voice, topics)
VALUES (
  'Наташа',
  'Эксперт по Wildberries, помогаю селлерам зарабатывать на маркетплейсе',
  'Дружелюбный, экспертный, мотивирующий',
  ARRAY['Wildberries', 'Селлеры', 'Маркетплейс', 'Бизнес']
);