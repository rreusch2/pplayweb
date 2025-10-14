-- Create chatkit_sessions table for tracking OpenAI ChatKit sessions
CREATE TABLE IF NOT EXISTS chatkit_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  thread_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired'))
);

-- Create indexes for better query performance
CREATE INDEX idx_chatkit_sessions_user_id ON chatkit_sessions(user_id);
CREATE INDEX idx_chatkit_sessions_created_at ON chatkit_sessions(created_at DESC);
CREATE INDEX idx_chatkit_sessions_status ON chatkit_sessions(status);

-- Enable Row Level Security
ALTER TABLE chatkit_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ChatKit sessions" ON chatkit_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ChatKit sessions" ON chatkit_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ChatKit sessions" ON chatkit_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_chatkit_sessions()
RETURNS void AS $$
BEGIN
  UPDATE chatkit_sessions 
  SET status = 'expired' 
  WHERE status = 'active' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired sessions
-- You can run this via a cron job or Supabase Edge Function
-- SELECT cron.schedule('cleanup-chatkit-sessions', '0 0 * * *', 'SELECT cleanup_expired_chatkit_sessions();');
