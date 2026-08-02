# Phase 2 â€” Persistence Foundation

## Completed features

- Added local SQLite configuration and one SQLAlchemy session per FastAPI request.
- Added the initial `games` model with UUID identifiers, normalized absolute paths, UTC timestamps, and unique executable paths.
- Added Alembic with migration `20260729_01_create_games`.
- Added versioned `GET`, `POST`, `PATCH`, and `DELETE` game API contracts under `/api/v1/games`.
- Added stable API validation, not-found, and duplicate-path error responses.
- Added automated health, migration, and CRUD API tests.
- Configured Electron's sandboxed preload bundle as CommonJS so the typed health bridge loads in development and production.

## Architecture decisions

FastAPI remains the sole owner of persistence and business rules. Electron only passes a per-user database location in packaged mode; React and the preload bridge were not expanded for Phase 2. FastAPI applies the checked-in Alembic migration chain during startup so Electron users do not require a separate migration step.

## Important files

| File | Responsibility |
| --- | --- |
| `backend/app/database.py` | SQLite engine and request-scoped session dependency. |
| `backend/app/models.py` | SQLAlchemy `Game` model. |
| `backend/alembic/versions/20260729_01_create_games.py` | Initial database migration. |
| `backend/app/api/v1/games.py` | Thin versioned games route handlers. |
| `backend/app/repositories.py` / `services.py` | Persistence operations and game use cases. |
| `backend/tests/test_games_api.py` | CRUD API coverage. |

## Database changes

The `games` table is now the first authoritative SQLite table. It contains the documented record fields and a unique `executable_path` constraint. Development uses `database/the-launcher.db`; packaged Electron uses its user-data directory through `LAUNCHER_DATABASE_PATH`.

## API endpoints

- `GET /health`
- `GET /api/v1/games`
- `POST /api/v1/games`
- `GET /api/v1/games/{id}`
- `PATCH /api/v1/games/{id}`
- `DELETE /api/v1/games/{id}`

## Verification

- `python -m pytest backend/tests` passes five tests.
- `npm run build` passes TypeScript typechecking and production bundling.
- A live Uvicorn run applied migrations, returned health status, and completed a games create/list request.

## Known limitations

The renderer still deliberately has no games UI. There is no launch integration, search/filter endpoint, scanner, session tracking, metadata fetch, or artwork cache yet.

## How to continue

Begin Phase 3 only after approval. Build the React game-library experience on the existing games API: manual add/edit/delete flows, cards, search/filter behavior, and empty/loading/error states. Do not add launch, scanner, metadata, or statistics work yet.

## Suggested commit

`feat(persistence): add SQLite games API and Alembic foundation`
