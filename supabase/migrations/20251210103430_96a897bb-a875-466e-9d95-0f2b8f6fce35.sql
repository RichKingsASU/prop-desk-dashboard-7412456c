-- Drop the browser write policies - backend Python service will write using service role
DROP POLICY IF EXISTS "Allow anon to insert live_quotes" ON public.live_quotes;
DROP POLICY IF EXISTS "Allow anon to update live_quotes" ON public.live_quotes;
DROP POLICY IF EXISTS "live_quotes_insert_anon" ON public.live_quotes;
DROP POLICY IF EXISTS "live_quotes_update_anon" ON public.live_quotes;