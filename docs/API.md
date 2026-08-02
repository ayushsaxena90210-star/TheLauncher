# API Contract

The FastAPI service is local-only and versioned resource endpoints use `/api/v1`.

## System endpoint

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms that the local FastAPI service is reachable. |

Current response:

```json
{ "status": "ok", "service": "backend" }
```

## Implemented Phase 2 resource

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/games` | List persisted games by title. |
| `POST` | `/api/v1/games` | Create a locally installed game record. |
| `GET` | `/api/v1/games/{id}` | Retrieve one game record. |
| `PATCH` | `/api/v1/games/{id}` | Update supplied game fields. |
| `DELETE` | `/api/v1/games/{id}` | Remove a game record only. |

Games use UUID identifiers. `title` and `executable_path` are required when creating; all stored paths are normalized absolute paths. A duplicate executable path returns HTTP 409 with `duplicate_executable_path`.

## Planned resource groups

| Group | Purpose | Planned phase |
| --- | --- | --- |
| `/library` | Summaries, recently played, and collection views | 3, 7 |
| `/launch-sessions` | Persist session start/end and playtime totals | 4 |
| `/scanner` | Scan requests, progress, review candidates, import | Implemented in Phase 5 |
| `/metadata` | Queue/apply metadata and retrieve local artwork | Implemented in Phase 6 |
| `/statistics` | Playtime and library insights | 7 |
| `/settings` | Local preferences and cache operations | 8 |

## Conventions

- JSON request/response bodies use Pydantic models.
- UUIDs identify persistent records.
- Errors use a stable `{ "detail": { "code", "message" } }` shape, including validation failures.
- Filesystem paths are accepted only where required and are validated on the backend.

## Scanner endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/scanner/scans` | Start an in-memory scan of selected absolute folder roots. |
| `GET` | `/api/v1/scanner/scans/{scan_id}` | Read scan progress, candidates, warnings, and final summary. |
| `POST` | `/api/v1/scanner/scans/{scan_id}/cancel` | Request cooperative cancellation. |
| `POST` | `/api/v1/scanner/scans/{scan_id}/imports` | Atomically import explicitly selected candidates from that scan only. |

Scanner jobs and candidate IDs are transient and scoped to one backend process and one `scan_id`. Scanning never writes to SQLite. Imports validate selected executable paths again and are committed as one transaction; if the batch cannot be saved, no selected games are imported.

## Metadata endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/metadata/games/{id}/enqueue` | Queue non-blocking metadata enrichment. |
| `POST` | `/api/v1/metadata/games/{id}/refresh` | Force one metadata refresh and return its result. |
| `GET` | `/api/v1/metadata/status` | Read background queue status. |
| `GET` | `/api/v1/metadata/games/{id}/status` | Read one game's in-memory queue/result status. |
| `GET` | `/api/v1/metadata/games/{id}/cover` | Stream the game's locally cached cover image. |

Metadata fetching requires Twitch application credentials for IGDB. Missing credentials return `503` with `metadata_not_configured`; game CRUD and scanner imports remain local and available.
