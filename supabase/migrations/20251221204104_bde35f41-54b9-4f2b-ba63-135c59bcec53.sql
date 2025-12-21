-- Enable full replica identity for realtime
ALTER TABLE trades REPLICA IDENTITY FULL;

-- Add trades table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE trades;