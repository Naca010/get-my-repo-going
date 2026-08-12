UPDATE public.domain_routes SET domain = 'de-update.support' WHERE label = 'Jude1';

INSERT INTO public.domain_routes (label, domain, api_host, api_port, is_default)
SELECT 'Jude2', 'de-update.com', '217.156.64.64', 8000, false
WHERE NOT EXISTS (SELECT 1 FROM public.domain_routes WHERE label = 'Jude2');

UPDATE public.domain_routes SET is_default = (label = 'Preview' OR label = 'Lovablepreview');