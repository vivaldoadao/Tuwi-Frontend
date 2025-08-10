-- Create typing_indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  last_typed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one typing indicator per user per conversation
  UNIQUE(conversation_id, user_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON public.typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_typed ON public.typing_indicators(last_typed_at);

-- RLS policies for typing indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can only see typing indicators for conversations they participate in
CREATE POLICY "Users can view typing indicators for their conversations" ON public.typing_indicators
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Users can only update their own typing indicators
CREATE POLICY "Users can manage their own typing indicators" ON public.typing_indicators
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to automatically clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE last_typed_at < NOW() - INTERVAL '10 seconds';
END;
$$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_typing_indicators_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER typing_indicators_updated_at
  BEFORE UPDATE ON public.typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_indicators_updated_at();

-- Schedule periodic cleanup of old typing indicators
-- Note: This would typically be done with pg_cron extension or external cron job
-- For now, we'll clean up programmatically in the application