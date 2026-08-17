CREATE TABLE IF NOT EXISTS public.bot_completion_notifications (
  task_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_completion_notifications TO service_role;
ALTER TABLE public.bot_completion_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages completion notifications"
  ON public.bot_completion_notifications FOR ALL
  TO service_role USING (true) WITH CHECK (true);