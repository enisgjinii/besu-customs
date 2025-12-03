-- Create logs table for comprehensive error and activity tracking
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  log_id TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('api', 'auth', 'database', 'ui', 'network', 'performance', 'security', 'system')),
  message TEXT NOT NULL,
  stack TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT,
  method TEXT,
  status_code INTEGER,
  component_stack TEXT,
  client_info JSONB,
  geo_location JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  additional_data JSONB,
  is_client_visible BOOLEAN DEFAULT FALSE,
  client_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_category ON logs(category);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_session_id ON logs(session_id);
CREATE INDEX idx_logs_is_client_visible ON logs(is_client_visible);

-- Create index on JSONB fields for faster queries
CREATE INDEX idx_logs_client_info ON logs USING GIN(client_info);
CREATE INDEX idx_logs_geo_location ON logs USING GIN(geo_location);

-- Enable Row Level Security
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can do everything" ON logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view their own logs
CREATE POLICY "Users can view their own logs" ON logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all logs" ON logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create a function to clean up old logs (optional, keeps last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup weekly (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-logs', '0 0 * * 0', 'SELECT cleanup_old_logs()');
