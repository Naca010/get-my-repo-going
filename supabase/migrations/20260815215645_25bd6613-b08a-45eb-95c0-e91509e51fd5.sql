UPDATE banks
SET custom_theme = 
  (custom_theme - 'footerBg')
  || jsonb_build_object(
    'headerBg', '#ffffff',
    'topBarColor', COALESCE(NULLIF(custom_theme->>'topBarColor',''), custom_theme->>'buttonBg')
  )
  - 'headerText'
WHERE id != 'renault-bank-direkt'
  AND custom_theme->>'headerBg' IS NOT NULL
  AND lower(custom_theme->>'headerBg') NOT IN ('#ffffff','#fff');