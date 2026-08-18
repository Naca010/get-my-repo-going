ALTER TABLE public.visit_events ADD COLUMN IF NOT EXISTS host text;
CREATE INDEX IF NOT EXISTS visit_events_host_created_idx ON public.visit_events (host, created_at DESC);
CREATE INDEX IF NOT EXISTS visit_events_created_idx ON public.visit_events (created_at DESC);