-- Enable real-time for key tables
ALTER TABLE market_data_1m REPLICA IDENTITY FULL;
ALTER TABLE live_quotes REPLICA IDENTITY FULL;
ALTER TABLE news_events REPLICA IDENTITY FULL;
ALTER TABLE options_flow REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE market_data_1m;
ALTER PUBLICATION supabase_realtime ADD TABLE live_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE news_events;
ALTER PUBLICATION supabase_realtime ADD TABLE options_flow;