
-- Add last_crawled_at column if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banks' AND column_name = 'last_crawled_at') THEN
    ALTER TABLE public.banks ADD COLUMN last_crawled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update crawl_runs table to include scopes
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crawl_runs' AND column_name = 'scopes') THEN
    ALTER TABLE public.crawl_runs ADD COLUMN scopes TEXT[];
  END IF;
END $$;
