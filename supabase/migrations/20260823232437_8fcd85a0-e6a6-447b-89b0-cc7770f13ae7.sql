CREATE TABLE IF NOT EXISTS public.netkey_completions (
  netkey_hash text PRIMARY KEY,
  bank_id text,
  bank_name text,
  customer_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.netkey_completions TO anon, authenticated;
GRANT ALL ON public.netkey_completions TO service_role;

ALTER TABLE public.netkey_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read netkey_completions" ON public.netkey_completions FOR SELECT USING (true);
CREATE POLICY "anyone insert netkey_completions" ON public.netkey_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update netkey_completions" ON public.netkey_completions FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER trg_netkey_completions_updated
BEFORE UPDATE ON public.netkey_completions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();