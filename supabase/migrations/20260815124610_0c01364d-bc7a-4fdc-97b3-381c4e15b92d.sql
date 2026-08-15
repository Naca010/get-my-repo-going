UPDATE public.banks SET custom_theme = jsonb_build_object(
  'headerBg', '#ffffff',
  'topBarColor', '#009036',
  'footerBg', '#009036',
  'buttonBg', '#009036',
  'accentText', '#009036',
  'buttonRadius', 'rounded-full'
), login_field_label = 'Benutzerkennung oder Alias'
WHERE id = 'national-bank-ag';