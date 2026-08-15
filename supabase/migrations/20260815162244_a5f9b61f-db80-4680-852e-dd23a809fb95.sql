
CREATE TABLE IF NOT EXISTS public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banks' AND column_name='imprint_data') THEN
    ALTER TABLE public.banks ADD COLUMN imprint_data jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banks' AND column_name='privacy_data') THEN
    ALTER TABLE public.banks ADD COLUMN privacy_data jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banks' AND column_name='contact_data') THEN
    ALTER TABLE public.banks ADD COLUMN contact_data jsonb;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO anon;
GRANT ALL ON public.banks TO service_role;
