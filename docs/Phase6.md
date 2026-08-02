# Phase 6 â€” Metadata & Cover Artwork

## Completed work

- Added IGDB metadata lookup using Twitch client-credentials OAuth, rate limiting, title matching, and an in-memory background queue.
- Added local cover-art download validation and cache management in `database/assets/covers` (or the packaged database directory).
- Added `igdb_id`, metadata source/confidence, and genres to the game record through Alembic revision `20260802_01`.
- Added local metadata queue/status/refresh/cover endpoints and narrow Electron IPC for queueing and completion notifications.
- Added cover rendering, metadata fetch/retry controls, and read-only game metadata in the library UI.
- Preserved FastAPI ownership of persistence and metadata work, Electron ownership of IPC, and renderer filesystem isolation.

## Verification

- `npm run build` passes, including TypeScript type checking.
- `python -m pytest backend/tests -q` passes: 22 tests covering metadata, CRUD, sessions/launch lifecycle, migrations, and scanner regression.

## Configuration

Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `backend/.env` to enable IGDB fetching. Without them, metadata requests return a clear local configuration error; the rest of the launcher remains usable.
