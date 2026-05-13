CREATE TABLE public.oauth_failure_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  stage text NOT NULL,
  error_code text,
  error_message text,
  user_id text,
  email text,
  redirect_uri text,
  url text,
  ip text,
  user_agent text,
  referer text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oauth_failure_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read oauth failure logs"
ON public.oauth_failure_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_oauth_failure_logs_occurred_at ON public.oauth_failure_logs (occurred_at DESC);
CREATE INDEX idx_oauth_failure_logs_provider ON public.oauth_failure_logs (provider);
CREATE INDEX idx_oauth_failure_logs_stage ON public.oauth_failure_logs (stage);
CREATE INDEX idx_oauth_failure_logs_error_code ON public.oauth_failure_logs (error_code);