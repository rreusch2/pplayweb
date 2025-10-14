-- Create table for persistent ChatKit conversations
CREATE TABLE IF NOT EXISTS chatkit_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT,
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_chatkit_conversations_user_id ON chatkit_conversations(user_id);
CREATE INDEX idx_chatkit_conversations_session_id ON chatkit_conversations(session_id);
CREATE INDEX idx_chatkit_conversations_updated_at ON chatkit_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE chatkit_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations" 
  ON chatkit_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
  ON chatkit_conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
  ON chatkit_conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
  ON chatkit_conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chatkit_conversations_updated_at 
  BEFORE UPDATE ON chatkit_conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
