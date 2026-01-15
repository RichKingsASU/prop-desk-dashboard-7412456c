# UI → Backend API Contract (Firebase Auth + REST)

This UI **must not** connect directly to any database. All data access flows through a backend REST API. Authentication is handled with **Firebase Auth (client SDK)**; the UI attaches a Firebase ID token to API requests.

## Auth

- **Header**: `Authorization: Bearer <firebase_id_token>`
- **Required for all endpoints** except `GET /healthz`.
- The backend must validate the Firebase ID token and authorize access accordingly.

## Base URLs

- **REST base**: `VITE_API_BASE_URL`
- **Optional WS base** (for realtime streaming): `VITE_WS_BASE_URL`

## Error shape (recommended)

Backend should return JSON errors in the form:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Endpoints

### Health

- **GET** `/healthz`
  - **Auth**: none
  - **200**: `{ "ok": true }`

### Identity

- **GET** `/me`
  - Returns the authenticated principal.
  - **200**: `{ "uid": "string", "email": "string|null" }`

### Profile

- **GET** `/profiles/me`
  - Returns the user profile used for settings + personalization.
  - **200**: `{ "id": "string", "email": "string|null", "display_name": "string|null", "avatar_url": "string|null", "trading_mode": "string|null" }`

- **PATCH** `/profiles/me`
  - **Body** (partial): `{ "display_name"?: string|null, "avatar_url"?: string|null, "trading_mode"?: string|null }`
  - **200**: same as `GET /profiles/me`

### Dev Event Logs (replaces previous edge-function ingestion)

- **POST** `/dev-event-logs`
  - Used by the in-browser dev console to persist structured logs.
  - **Body**:
    ```json
    {
      "logs": [
        {
          "source": "string",
          "level": "info|warn|error|debug",
          "event_type": "string",
          "message": "string",
          "meta": {}
        }
      ]
    }
    ```
  - **204** or **200**: accepted

### Trading / Market Data

- **GET** `/paper-trades?limit=50`
  - Latest paper trades.

- **GET** `/market-data/1m/latest?limit=200`
  - Latest 1m bars.
  - **Expected query params**:
    - `symbol` (optional, recommended): `symbol=SPY`
    - `symbols` (optional, for batching): `symbols=SPY,AAPL,TSLA`
  - **TODO (backend)**: support per-symbol latest bars and small batching for sparklines.

- **GET** `/live-quotes?symbols=...`
  - Live quote cache.
  - **Expected query params**:
    - `symbols` required: comma-separated symbol list (e.g. `symbols=SPY,AAPL`)
    - `symbols=*` MAY be used to request “all available quotes” for dashboards.

- **GET** `/news-events?limit=...`
  - Latest news events.
  - **Expected query params** (optional):
    - `source`
    - `symbol`

- **GET** `/options-flow?limit=...`
  - Latest options flow prints.

- **GET** `/alpaca-option-snapshots?filters...&limit=500`
  - Options chain snapshot feed.
  - **Expected query params** (optional):
    - `underlying_symbol`
    - `since` (ISO timestamp)
    - `option_type`
    - `strike_min`, `strike_max`
    - `expiration`

### Brokerage / System

- **GET** `/broker-accounts`
  - Returns linked broker accounts (paper/live).

- **GET** `/system/state`
  - Returns system status and optional derived freshness metrics used by Ops/Developer screens.
  - **TODO (backend)**: include freshness summaries so UI does not compute from DB tables.

- **GET** `/system/logs?limit=...`
  - Returns persisted dev/system logs for the “Log History” tab.
  - **TODO (backend)**: add server-side filtering/pagination (cursor) if needed.

- **POST** `/system/commands`
  - Sends a command to the backend orchestrator.
  - **Body**: `{ "command": "string", "args"?: {} }`

### Trades / Portfolio

- **GET** `/trades/recent?limit=50`
  - Recent executions / trade events.

- **GET** `/portfolio/performance`
  - Performance time series / summary for dashboard KPI panels.

## Realtime (WebSocket) — TODO

The UI no longer subscribes to database changefeeds directly. If realtime is required, backend must provide a WS API at `VITE_WS_BASE_URL`.

Recommended:

- `GET /system/state` returns `{ wsEnabled: boolean }`
- WS messages are namespaced by topic, e.g.:
  - `quotes:update`
  - `trades:insert`
  - `market-data-1m:insert`

