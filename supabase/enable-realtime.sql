-- Enable real-time for messages and conversations tables
-- This SQL should be executed in the Supabase SQL Editor

-- Enable real-time publication for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable real-time publication for conversations  
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify publications
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';