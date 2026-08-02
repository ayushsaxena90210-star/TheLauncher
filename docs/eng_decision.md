# Engineering Decisions

## Database
- SQLite chosen for local-first desktop application.

## Time Handling
- All timestamps stored in UTC.
- UI converts to local timezone.

## Path Storage
- Store normalized absolute paths.
- Validate existence only when launching.

## Migrations
- Alembic used.
- Schema changes must be SQLite-compatible.

## Backend
- FastAPI owns all business logic.
- Electron is responsible only for desktop integration.