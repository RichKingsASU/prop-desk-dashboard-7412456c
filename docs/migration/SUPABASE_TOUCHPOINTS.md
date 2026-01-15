# Legacy DB Vendor Touchpoints (must reach zero)

This file inventories every legacy DB-vendor touchpoint present at migration start so we can remove them all. **Exit condition:** repo-wide search for the legacy-vendor identifiers below returns **zero matches**:

- `s u p a b a s e`
- `@ s u p a b a s e / s u p a b a s e - j s`
- `create Client`
- `postgres changes`
- `.channel (`
- `storage . from`

## Files / Areas (inventory)

- `src/integrations/<legacy-db>/client.ts`
  - Legacy DB client initialization using `import.meta.env` keys.

- `src/integrations/<legacy-db>/types.ts`
  - Generated DB typing for legacy client.

- `src/contexts/AuthContext.tsx`
  - Legacy auth session management + profile reads from `profiles`.

- `src/pages/Auth.tsx`
  - Legacy email/password sign-in/sign-up + Google OAuth.

- `src/contexts/DataStreamContext.tsx`
  - Legacy realtime changefeeds for `market_data_1m`, `live_quotes`, `news_events`, `options_flow`
  - Also read latest timestamps directly from DB tables.

- `src/contexts/ExchangeContext.tsx`
  - Loaded `broker_accounts` from DB and subscribed to changes via changefeeds.
  - Periodic connection/latency checks via DB reads.
  - Contained a hardcoded provider entry for direct DB access.

- `src/hooks/useLiveQuotes.ts`
  - Reads `live_quotes` and subscribes to realtime updates.

- `src/hooks/useLivePrice.ts`
  - Reads `market_data_1m` and `live_quotes`, subscribes to realtime updates for a symbol.

- `src/hooks/useLiveWatchlist.ts`
  - Reads `market_data_1m` for sparklines and contains a mock watchlist fallback.

- `src/hooks/useNewsEvents.ts`
  - Reads `news_events` with filters.

- `src/hooks/useOptionsSnapshots.ts`
  - Reads `alpaca_option_snapshots` (and applies client-side filtering).

- `src/hooks/useDataFreshness.ts`
  - Reads multiple tables and counts recent rows for freshness dashboards.

- `src/components/RecentTradesTable.tsx`
  - Reads `trades` and subscribes to realtime INSERT events.

- `src/components/developer/LogHistoryTab.tsx`
  - Reads `dev_event_logs` from DB.

- `src/lib/eventLogStore.ts`
  - Hardcoded function-ingest URL and token header for log persistence (legacy path).

- `src/pages/test/*` and `src/components/test/*`
  - Test-only dashboard that previously performed direct DB connectivity checks.

- `legacy backend folder` (root-level)
  - Local function + migrations used by prior setup.

- `docs/<legacy-db>-setup.md`
  - Legacy vendor setup guide.

- `package.json` / `package-lock.json`
  - Legacy DB client dependency.

- `.env`
  - Supabase environment variables and keys.

## Completion Checklist

- [ ] All files above deleted or refactored to use Firebase Auth + backend REST only
- [ ] Root legacy vendor folder removed from this UI repo
- [ ] Repo-wide search for banned legacy identifiers returns **zero** matches

