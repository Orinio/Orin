-- Create AI usage log table for accurate rate limiting
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_endpoint ON public.ai_usage_log (user_id, endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_recent ON public.ai_usage_log (user_id, created_at DESC);

-- RLS policies
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own AI usage" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Service role can insert usage logs
CREATE POLICY "Service role can insert AI usage" ON public.ai_usage_log
  FOR INSERT WITH CHECK (true);

-- Function to clean up old usage logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_usage_log
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily
SELECT cron.schedule(
  'cleanup-old-ai-usage',
  '0 2 * * *',
  $$SELECT public.cleanup_old_ai_usage();$$
);
