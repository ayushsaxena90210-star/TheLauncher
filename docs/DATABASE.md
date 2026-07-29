# Database Design

SQLite is the active local datastore. In development the default database file is `database/the-launcher.db`; packaged Electron provides a per-user application-data path through `LAUNCHER_DATABASE_PATH`. FastAPI applies the versioned Alembic migrations during startup.

## Current table

| Table | Key fields | Purpose |
| --- | --- | --- |
| `games` | id, title, executable_path, install_path, cover_path, description, release_date, created_at, updated_at | Implemented in migration `20260729_01`; local library record and selected metadata. |

## Planned tables

| Table | Key fields | Purpose |
| --- | --- | --- |
| `game_sessions` | id, game_id, started_at, ended_at, duration_seconds | Immutable launch/playtime record. |
| `scan_roots` | id, path, enabled, created_at | User-approved folders to scan. |
| `scanner_ignores` | id, pattern, scope | User or system rules for ignoring known non-game executables. |
| `metadata_cache` | id, provider, external_id, payload_json, fetched_at, expires_at | Cached remote metadata; never an online backend. |
| `settings` | key, value_json, updated_at | Local settings, including theme and metadata API key reference. |

## Relationships and constraints

- One game has zero or many game sessions.
- `games.executable_path` is unique after normalization within the supported operating-system rules.
- Deleting a game deletes its sessions but does not delete the original executable or install folder.
- Artwork cache cleanup must only remove files not referenced by a game or metadata-cache record.

## Migration strategy

Alembic provides explicit, versioned SQLAlchemy migrations. The first revision is `20260729_01_create_games`. Schema changes must never be applied by ad-hoc SQL from the UI.
