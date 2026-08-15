ALTER TABLE public.banks
ADD COLUMN imprint_data JSONB,
ADD COLUMN privacy_data JSONB,
ADD COLUMN contact_data JSONB;

GRANT ALL ON public.banks TO authenticated;
GRANT ALL ON public.banks TO service_role;
GRANT SELECT ON public.banks TO anon;
