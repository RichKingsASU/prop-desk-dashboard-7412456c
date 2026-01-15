# Supabase UI Setup Guide

## Runtime Configuration (No `.env`)

This project does **not** read configuration from `.env`, `import.meta.env`, or `process.env`.

The UI fetches Supabase connection values from a backend endpoint:
- `GET /config/supabase` returns:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

Those values should be sourced from **Google Secret Manager** by your backend (fail fast if missing).

## Required Tables

### `public.market_data_1m`
Canonical 1-minute OHLCV bars.

| Column | Type | Description |
|--------|------|-------------|
| symbol | text | Ticker symbol (e.g., SPY) |
| ts | timestamptz | Bar timestamp (UTC) |
| open | numeric | Opening price |
| high | numeric | High price |
| low | numeric | Low price |
| close | numeric | Closing price |
| volume | bigint | Volume |

### `public.paper_trades`
Paper trading log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamptz | Trade timestamp |
| symbol | text | Ticker symbol |
| side | text | buy/sell |
| qty | numeric | Quantity |
| price | numeric | Execution price |
| status | text | Order status |
| source | text | Origin of trade |

### `public.live_quotes`
Real-time L1 quote cache (updated by streaming pipeline).

| Column | Type | Description |
|--------|------|-------------|
| symbol | text | Ticker symbol (PK) |
| bid_price | numeric | Best bid |
| ask_price | numeric | Best ask |
| last_trade_price | numeric | Last trade |
| last_update_ts | timestamptz | Quote timestamp |

## RLS / Permissions

For the UI to read data, either:
1. **RLS is disabled** on the tables, OR
2. **Policies allow SELECT for anon role**

### Example RLS Policies (if RLS is enabled)

```sql
-- Allow anonymous reads on market_data_1m
CREATE POLICY "Allow anon select on market_data_1m"
ON public.market_data_1m
FOR SELECT
TO anon
USING (true);

-- Allow anonymous reads on paper_trades
CREATE POLICY "Allow anon select on paper_trades"
ON public.paper_trades
FOR SELECT
TO anon
USING (true);

-- Allow anonymous reads on live_quotes
CREATE POLICY "Allow anon select on live_quotes"
ON public.live_quotes
FOR SELECT
TO anon
USING (true);
```

> ⚠️ **Note**: These policies allow public read access. For production, implement proper authentication and restrict access appropriately.

## Troubleshooting

### Widgets show "Error" messages
1. Check that `GET /config/supabase` returns valid JSON
2. Verify RLS policies allow SELECT for the anon role
3. Check browser console for specific error messages

### Widgets show empty state
- `live_quotes`: Streaming pipeline hasn't populated data yet
- `market_data_1m`: Ingestion loop hasn't run yet
- `paper_trades`: No trades have been placed

### Connection test
Navigate to `/test/supabase-dashboard` and check the status banner. It should show "Connected" if Supabase is reachable.

## UI Routes

| Route | Description |
|-------|-------------|
| `/test` | Test Hub - index of experiments |
| `/test/supabase-dashboard` | Live Supabase data dashboard |

## Firebase Configuration

The UI must obtain Firebase config via a backend endpoint (or CI injection).

- `GET /config/firebase` returns:
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_APP_ID`

These values should be read from **Google Secret Manager** and must not be remapped or swapped.
