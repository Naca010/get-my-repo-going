ALTER TABLE public.banks
  ADD COLUMN IF NOT EXISTS footer_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_language text,
  ADD COLUMN IF NOT EXISTS footer_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS logo_source_url text;