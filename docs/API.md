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
| `/scanner` | Scan requests, progress, review candidates, import | 5 |
| `/metadata` | Search, apply metadata, retrieve local artwork | 6 |
| `/statistics` | Playtime and library insights | 7 |
| `/settings` | Local preferences and cache operations | 8 |

## Conventions

- JSON request/response bodies use Pydantic models.
- UUIDs identify persistent records.
- Errors use a stable `{ "detail": { "code", "message" } }` shape, including validation failures.
- Filesystem paths are accepted only where required and are validated on the backend.
