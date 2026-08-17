UPDATE public.banks
SET logo_url = '/api/public/asset?b=bank-logos&p=' || regexp_replace(logo_url, '^.*/bank-logos/', '')
WHERE logo_url LIKE '%/storage/v1/object/public/bank-logos/%';