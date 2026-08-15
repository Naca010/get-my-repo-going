
UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#00485C','buttonBg','#00485C','accentText','#00485C','topBarColor','#00485C','buttonRadius','rounded-full'
) WHERE id = 'bank-fu-r-kirche-und-diakonie-eg-kd-bank';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#00873E','buttonBg','#00873E','accentText','#00873E','topBarColor','#00873E','buttonRadius','rounded-full'
) WHERE id = 'national-bank-ag';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#0066B3','buttonBg','#0066B3','accentText','#0066B3','topBarColor','#0066B3','buttonRadius','rounded-none'
) WHERE id = 'bankhaus-max-flessa-kg-flessabank';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#2C5F87','buttonBg','#2C5F87','accentText','#2C5F87','topBarColor','#2C5F87','buttonRadius','rounded-full'
) WHERE id = 'bankhaus-e-mayer-ag';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#005CA9','buttonBg','#005CA9','accentText','#005CA9','topBarColor','#005CA9','buttonRadius','rounded-none'
) WHERE id = 'bbbank';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#4A4A4A','buttonBg','#4A4A4A','accentText','#1A1A1A','topBarColor','#7AB51D','buttonRadius','rounded-full'
) WHERE id = 'cvw-privatbank-eg';

UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg','#0F1E5A','buttonBg','#0F1E5A','accentText','#0F1E5A','topBarColor','#00D661','buttonRadius','rounded-none'
) WHERE id = 'gls';
