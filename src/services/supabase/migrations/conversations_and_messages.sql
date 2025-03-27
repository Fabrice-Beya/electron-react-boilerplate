-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  context_type TEXT, -- 'entry', 'entries', 'general', etc.
  context_reference UUID, -- Optional reference to an entry ID or other entity
  provider TEXT, -- 'ollama', 'deepseek', etc.
  model TEXT, -- Store which model was used
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('user', 'ai')),
  content TEXT NOT NULL,
  is_liked BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- For storing additional data like tokens used, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_context_reference ON conversations(context_reference);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Add RLS policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access messages from their conversations"
  ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));

-- Create a stored procedure for creating a message exchange (user message + AI response)
CREATE OR REPLACE FUNCTION create_message_exchange(
  p_conversation_id UUID,
  p_user_prompt TEXT,
  p_ai_response TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Insert user message
  INSERT INTO messages (
    conversation_id,
    author,
    content,
    is_liked,
    metadata
  ) VALUES (
    p_conversation_id,
    'user',
    p_user_prompt,
    FALSE,
    NULL
  );
  
  -- Insert AI response
  INSERT INTO messages (
    conversation_id,
    author,
    content,
    is_liked,
    metadata
  ) VALUES (
    p_conversation_id,
    'ai',
    p_ai_response,
    FALSE,
    p_metadata
  );
  
  -- Update conversation's updated_at timestamp
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql; 