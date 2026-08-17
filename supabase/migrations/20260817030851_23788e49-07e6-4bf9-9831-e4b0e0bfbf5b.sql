ALTER TABLE public.bot_completion_notifications
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS city text;

GRANT SELECT ON public.bot_completion_notifications TO authenticated;

DROP POLICY IF EXISTS "admins read completion notifications" ON public.bot_completion_notifications;
CREATE POLICY "admins read completion notifications"
  ON public.bot_completion_notifications FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));