# Phase 2 Handoff

## Current state

Phase 2 is complete. The Electron + React foundation remains unchanged visually. The FastAPI service now owns SQLite persistence, applies Alembic migrations on startup, and exposes a small local games CRUD API at `/api/v1/games`.

## Verify Phase 2

Use a Python environment with the backend requirements installed, then run:

```powershell
npm run build
& 'C:\path\to\python.exe' -m pytest backend\tests
```

Expected results: the production build succeeds and pytest reports five passing tests.

To run the backend directly:

```powershell
& 'C:\path\to\python.exe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765
```

FastAPI applies `20260729_01_create_games` on startup. In development it creates `database/the-launcher.db`; set `LAUNCHER_DATABASE_PATH` to override that location. Packaged Electron provides a per-user path automatically.

## What changed

- Added SQLAlchemy, Alembic, SQLite engine/session configuration, and migration startup.
- Added `games` persistence model and the first Alembic revision.
- Added `/api/v1/games` create, list, retrieve, update, and delete operations.
- Added API/migration tests and stable `{ "detail": { "code", "message" } }` error responses.
- Kept the preload bridge narrow and renderer unchanged; the preload bundle is emitted as CommonJS for Electron sandbox compatibility. No library UI was added.

## Next phase: Phase 3

Implement only the game-library UI: consume the existing local games API for manual add, edit, delete, cards, search/filter, and empty/loading/error states. Keep persistence rules in FastAPI and do not start launch/session, scanner, metadata, or statistics work.

## Suggested commit

`feat(persistence): add SQLite games API and Alembic foundation`
