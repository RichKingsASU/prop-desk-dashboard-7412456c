-- Create the dev_event_logs table for persisting debug console logs
CREATE TABLE public.dev_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  level text NOT NULL,
  event_type text NOT NULL,
  message text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX idx_dev_event_logs_created_at ON public.dev_event_logs(created_at DESC);
CREATE INDEX idx_dev_event_logs_source ON public.dev_event_logs(source);
CREATE INDEX idx_dev_event_logs_level ON public.dev_event_logs(level);

-- Enable Row Level Security
ALTER TABLE public.dev_event_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon SELECT only (browser can read, not write)
CREATE POLICY "Allow anon read access to dev logs"
  ON public.dev_event_logs
  FOR SELECT
  TO anon
  USING (true);