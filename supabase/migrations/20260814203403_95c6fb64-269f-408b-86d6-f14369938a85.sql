ALTER TABLE public.banks
  ADD COLUMN IF NOT EXISTS theme_extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_extracted_at timestamptz;