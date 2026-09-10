# Safe-Era Handoff Notes

This document records the work completed in the current branch so another AI can continue safely.

## Branch

Current working branch: `fix_map_from_dev`

The worktree already contains uncommitted changes. Preserve them and do not reset/revert unrelated work.

## Run Locally

Use two terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Normally the web app is at `http://localhost:5173`. If that port is occupied by an old Vite process, use the URL printed by Vite, for example `http://localhost:5174`.

The backend is expected at `http://localhost:5001`.

The project can be used in a browser. Capacitor is only needed to package the React frontend as an Android app:

```bash
cd frontend
npm run cap:build
npm run cap:open
```

## Completed Features

### Map and Location

- The Map page requests device/browser location automatically on page load.
- `locationService.js` waits up to 20 seconds for an improved location reading instead of immediately falling back to a coarse result.
- The map uses Leaflet and OpenStreetMap tiles. It does not require a Google Maps API key.
- When tiles fail, the map displays a connection warning instead of a blank map.
- The Map page has a manual `Render Live Location` control.

### News Feed

- The News page uses Google News India public RSS with the query `women safety India`.
- The backend fetches news at startup and every 10 minutes.
- The News page Refresh button calls `GET /api/news?refresh=true` to force a refresh.
- Google News is never called by the Map page.
- News article cards show source, date, resolved location (if present), risk label, share control, and publisher article link.

### Single-Collection News/Map Design

Only one MongoDB collection is used for both News and map risk data:

```text
Google News RSS
  -> NewsArticle collection
  -> News page
  -> GET /api/news/map-alerts
  -> Leaflet map overlay
```

`NewsArticle` is defined in `backend/src/models/NewsArticle.js` and stores:

| Field | Purpose |
|---|---|
| `articleUrl` | Unique source URL; prevents duplicate upserts |
| `title`, `source`, `publishedAt` | Article information |
| `riskLevel` | Enum: `high`, `medium`, `low` |
| `riskLabel` | User-facing risk text |
| `locationName` | Matched Indian city/state, otherwise `null` |
| `location.coordinates` | GeoJSON `[longitude, latitude]`, otherwise `null` |
| `hasMapLocation` | Whether the row can render on the map |
| `locationStatus` | `resolved` or `not_reported` |

Location matching currently uses a built-in India city/state coordinate list against the article title. News without a named supported India location intentionally remains `null`; do not invent an exact incident coordinate. The map renders only rows with `hasMapLocation: true`.

The redundant `MapSafetyAlert` design was removed. If an editor still shows a `MapSafetyAlert.js` tab, it is stale and should not be recreated unless the data design changes intentionally.

### News Risk Map Overlay

The Map page has a `Show news alerts` button.

- It calls `GET /api/news/map-alerts`, which reads only saved `NewsArticle` records from MongoDB.
- It shows risk pins and transparent areas:
  - Red: `high`
  - Orange: `medium`
  - Green: `low`
- When enabled, it zooms to include the stored India alert locations.
- The sidebar renders the same alert records, including a publisher article link.
- The risk dropdown filters the sidebar and map overlay by the `riskLevel` enum:
  - All
  - High danger
  - Medium risk
  - Low risk/awareness

Important: these areas are city/state reference areas from headlines, not official crime-zone boundaries or exact incident locations.

### Safe Places

- Real safe places are read from the backend `SafePlace` collection through `GET /api/map/nearby`.
- If the backend has no matching safe places or cannot be used, the Map page currently uses frontend fallback entries from `generateLocalPOIs()` in `frontend/src/pages/Map.jsx`.
- These fallback cards are demo data, not database data and not news data.
- The Map category filter (`All`, `Police`, `Hospital`, `Safe Zone`) hides other categories. In particular, selecting `Safe Zone` intentionally shows only safe-zone entries.

### Guardian Changes

- Guardian OTP verification was removed.
- New guardians are active immediately.
- Older pending guardians are upgraded to active the next time the guardian list is read.
- Guardian UI no longer shows OTP, resend, or pending-verification controls.
- Guardian records now require `guardianEmail` in addition to phone number.

### SMS and Email Notifications

- Existing Twilio SMS behavior was retained.
- Mailtrap email delivery was added using `nodemailer`.
- Email is sent for guardian added, test alert, SOS trigger, SOS cancellation, and mark-safe events.
- Mailtrap settings belong in `backend/.env`; only variable names/placeholders are in `backend/.env.example`.
- Never commit real SMTP, Twilio, MongoDB, JWT, or other credentials.

Required Mailtrap variable names:

```text
MAILTRAP_SMTP_HOST
MAILTRAP_SMTP_PORT
MAILTRAP_SMTP_USER
MAILTRAP_SMTP_PASS
MAILTRAP_FROM
```

Mailtrap Sandbox may only deliver to inboxes permitted by that Mailtrap account.

### Expired Login Token Handling

- Backend protected routes return `401` with `TOKEN_EXPIRED` when a JWT has expired.
- The Guardian page clears stored tokens and redirects to Login when this happens.
- The Map page also clears an expired session and redirects to Login rather than silently representing fallback cards as backend data.
- If API logs show `GET /api/map/nearby ... 401 Token expired`, log in again before debugging safe-place data.

## Main Files Changed

| Area | Files |
|---|---|
| News backend | `backend/src/controllers/newsController.js`, `backend/src/routes/newsRoutes.js`, `backend/src/models/NewsArticle.js` |
| News scheduling/routes | `backend/src/server.js`, `backend/src/routes/index.js` |
| Map UI | `frontend/src/pages/Map.jsx`, `frontend/src/components/Map/MapContainer.jsx` |
| News UI | `frontend/src/pages/CurrentAffairsPage.jsx` |
| Location | `frontend/src/services/locationService.js`, `frontend/src/pages/Dashboard.jsx` |
| Guardians | `backend/src/models/Guardian.js`, `backend/src/controllers/guardianController.js`, `backend/src/routes/guardianRoutes.js`, `frontend/src/pages/GuardianNetworkPage.jsx` |
| Email | `backend/src/services/emailService.js`, `backend/package.json`, `backend/.env.example` |
| Documentation | `README.md`, this file |

## End-to-End Verification Already Performed

The following tests were successful against the local backend:

- `GET /api/news?refresh=true` returned HTTP `200`.
- A live fetch returned 100 news articles.
- A subset had resolved India locations and coordinates.
- `GET /api/news/map-alerts` returned stored map-ready `NewsArticle` rows.
- Repeating a forced refresh did not increase map rows for the same article URLs, proving the URL upsert avoids duplicates.
- The Vite proxy endpoint `http://localhost:5174/api/news/map-alerts` returned HTTP `200` with stored alert rows during verification.
- Frontend production builds passed after the map/news changes.

## Known Issues and Next Priorities

1. `NewsArticle` location extraction is title-based and only recognizes the current India location list. Expand it or replace it with a reliable India-only geocoding/entity-extraction service if greater coverage is needed.
2. Atlas can intermittently produce `ECONNRESET` during a news upsert. The backend retries the idempotent bulk upsert once. Investigate MongoDB Atlas network allow-list/connection stability if it persists.
3. `SafePlace` fallback cards are demo data. Seed or build moderation/admin tools for real police, hospital, and safe-zone records.
4. The risk levels are keyword classifications of articles, not official safety ratings. Do not present them as authoritative danger boundaries.
5. The frontend has historically had stale Vite instances occupying port `5173`. Always use the current Vite URL printed in the terminal.
6. The frontend build reports a large bundle warning. This is non-blocking; consider route-level code splitting later.

## Suggested Prompt for the Next AI

```text
Read ashik_change.md first. Continue from the existing dirty branch without reverting changes. Preserve the single NewsArticle collection design: Google News -> NewsArticle -> News page and map overlay. Debug using the actual Vite URL and backend logs. Do not reintroduce MapSafetyAlert or fake exact news coordinates. Keep secrets out of tracked files.
```
