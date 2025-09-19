-- ================================================================================
-- ADMIN CHAT SETUP SQL
-- ================================================================================
-- This SQL file contains all the necessary database setup for the Admin Chat feature.
-- Run this in your Supabase SQL editor to enable the admin chat functionality.

-- Create admin_chat_messages table for real-time admin chat
CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'notification')),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    reply_to_message_id UUID REFERENCES admin_chat_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for admin chat messages
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only admin users can read/write chat messages
CREATE POLICY "Admin users can view chat messages" ON admin_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.admin_role = true
        )
    );

CREATE POLICY "Admin users can insert chat messages" ON admin_chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.admin_role = true
        )
    );

CREATE POLICY "Admin users can update their own messages" ON admin_chat_messages
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.admin_role = true
        )
    );

CREATE POLICY "Admin users can delete their own messages" ON admin_chat_messages
    FOR DELETE USING (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.admin_role = true
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_user_id ON admin_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at ON admin_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_reply_to ON admin_chat_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_admin_chat_updated_at ON admin_chat_messages;
CREATE TRIGGER trigger_admin_chat_updated_at
    BEFORE UPDATE ON admin_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_chat_updated_at();

-- ================================================================================
-- IMPORTANT SETUP INSTRUCTIONS
-- ================================================================================
-- 
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Enable Realtime for the admin_chat_messages table:
--    - Go to Database > Replication in your Supabase dashboard
--    - Find the admin_chat_messages table
--    - Toggle "Enable Realtime" to ON
-- 
-- 3. Test the chat functionality:
--    - Ensure your user has admin_role = true in the profiles table
--    - Navigate to the Admin Dashboard
--    - You should see the Admin Chat section with real-time messaging
--
-- ================================================================================
-- OPTIONAL: Sample data for testing
-- ================================================================================
-- 
-- -- Insert a test message (replace 'your-user-id' with actual admin user ID)
-- INSERT INTO admin_chat_messages (user_id, message, message_type) 
-- VALUES ('your-user-id', 'Welcome to the Admin Chat! 🎉', 'text');
--
-- ================================================================================

-- Verify the setup (optional - for debugging)
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'admin_chat_messages' 
-- ORDER BY ordinal_position;
