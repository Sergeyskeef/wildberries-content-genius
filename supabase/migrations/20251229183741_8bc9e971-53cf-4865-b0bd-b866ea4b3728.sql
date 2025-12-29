-- Enable RLS on all tables
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profile ENABLE ROW LEVEL SECURITY;

-- Public access policies (single-user app, no auth required)
CREATE POLICY "Public access for sources" ON public.sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for content_items" ON public.content_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for generated_posts" ON public.generated_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for expert_profile" ON public.expert_profile FOR ALL USING (true) WITH CHECK (true);