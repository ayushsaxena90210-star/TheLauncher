# API Contract (Proposed)

The FastAPI service is local-only. The health endpoint is implemented; all other endpoints below are proposed and will eventually be versioned under `/api/v1`.

## Phase 1 health contract

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms that the local FastAPI service is reachable. |

Current response:

```json
{ "status": "ok", "service": "backend" }
```

## Planned resource groups

| Group | Purpose | Planned phase |
| --- | --- | --- |
| `/games` | Create, read, update, delete, search, and filter library games | 2–3 |
| `/library` | Summaries, recently played, and collection views | 3, 7 |
| `/launch-sessions` | Persist session start/end and playtime totals | 4 |
| `/scanner` | Scan requests, progress, review candidates, import | 5 |
| `/metadata` | Search, apply metadata, retrieve local artwork | 6 |
| `/statistics` | Playtime and library insights | 7 |
| `/settings` | Local preferences and cache operations | 8 |

## Conventions

- JSON request/response bodies use Pydantic models.
- UUIDs identify persistent records.
- Errors use a stable `{ "detail": { "code", "message" } }` shape.
- Filesystem paths are accepted only where required and are validated on the backend.
