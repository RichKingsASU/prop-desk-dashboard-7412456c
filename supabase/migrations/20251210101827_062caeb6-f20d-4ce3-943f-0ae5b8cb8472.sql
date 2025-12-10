-- Allow anon role to insert live quotes (market data is public)
CREATE POLICY "Allow anon to insert live_quotes"
ON public.live_quotes
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to update live quotes
CREATE POLICY "Allow anon to update live_quotes"
ON public.live_quotes
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);