UPDATE public.banks SET
  custom_theme = jsonb_build_object(
    'primary', '60 100% 47%',
    'headerBg', '#000000',
    'buttonBg', '#EFDF00',
    'accentText', '#000000',
    'topBarColor', '#000000',
    'buttonRadius', 'rounded-none',
    'footerBg', '#000000'
  ),
  login_field_label = 'Renault-Key',
  hide_name_in_header = false
WHERE id = 'renault-bank-direkt';