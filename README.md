# The Launcher

An offline-first desktop game launcher being built as a portfolio-quality software engineering project. It will manage locally installed games, scan selected folders, launch executables, enrich games with metadata and cover art, and track playtime.

## Status

**Phase 8 Milestone A complete.** Local settings, persisted scan folders, metadata/cache management, themes, and desktop window controls are available.

## Scope

Planned capabilities:

- Manually add, edit, launch, and remove locally installed games.
- Scan selected folders for game executables.
- Search and filter the local library.
- Fetch metadata and cover artwork when the user requests it.
- Track local play sessions and library statistics.
- Store application data locally in SQLite.

Out of scope: downloading/torrents, piracy, accounts, cloud sync, social features, achievements, DRM bypass, telemetry, and an online backend.

## Architecture

```text
React renderer (UI only)
        | Electron IPC
Electron main process (windows, dialogs, executable launch, desktop integration)
        | local HTTP client
FastAPI backend (business rules, scanning, metadata, SQLite)
```

The app uses a Hydra-inspired desktop interface, but its implementation is independent and restricted to this project's scope. See [Architecture](docs/ARCHITECTURE.md).

## Stack

- Electron, React, TypeScript, Vite, Tailwind CSS, electron-builder
- FastAPI, Python, SQLAlchemy, SQLite, Pydantic, httpx, Pillow

## Current structure

```text
assets/     Application assets
backend/    FastAPI service and tests
database/   Local database location and development artifacts
docs/       Architecture, decisions, roadmap, and phase handoffs
src/        Electron main/preload and React renderer source
```

## Roadmap

Phase 1 established the runnable Electron + React + FastAPI development environment, base theme, and local health connection. Phase 2 added the SQLite persistence foundation and local API contracts. Phase 3 added the game library UI and manual game management. Phase 4 added launching and play sessions. Phase 5 added selected-folder scanning, review, and explicit batch import. Phase 6 added optional IGDB metadata and locally cached cover artwork. Phase 7 added a complete game-details experience with media and activity. Phase 8 Milestone A adds local settings infrastructure and its Settings Workspace.

See [Roadmap](docs/ROADMAP.md), [Phase 1 notes](docs/Phase1.md), [Phase 2 notes](docs/Phase2.md), [Phase 3 notes](docs/Phase3.md), [Phase 4 notes](docs/Phase4.md), [Phase 5 notes](docs/Phase5.md), [Phase 6 notes](docs/Phase6.md), and the current [handoff](HANDOFF.md).

## Screenshots

Placeholder — the Phase 1 foundation screen exists; portfolio screenshots will be added after the library UI is implemented.

## Current API endpoints

`GET /health`, game CRUD, play-session, scanner, and metadata endpoints are available locally. See [API.md](docs/API.md).

## Database schema

SQLite and the initial Alembic migration are implemented. The current schema and future tables are documented in [DATABASE.md](docs/DATABASE.md).

## Installation and running

1. Install Node.js 22+ and Python 3.12+ with `pip`.
2. Run `npm install`.
3. Create and activate a Python virtual environment, then run `python -m pip install -r backend/requirements.txt`.
4. Run `npm run dev`.

On systems where `python` does not identify the environment containing FastAPI, set `PYTHON_EXECUTABLE` to that interpreter before starting Electron. Full verification commands are in [handoff.md](handoff.md).

## Current development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Electron; it starts the local FastAPI service automatically. |
| `npm run backend:dev` | Start only FastAPI with reload for backend work. |
| `npm run typecheck` | Type-check Electron, preload, and React code. |
| `npm run build` | Type-check and create production web/Electron bundles. |
| `npm run backend:test` | Run FastAPI tests. |

## Known limitations

Metadata enrichment requires local Twitch application credentials (`TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`) for IGDB access. Desktop startup/window preferences remain placeholders for a future approved Phase 8 milestone. Unfinished play sessions (e.g. launcher closed while a game is running) are not recovered automatically.

## Credits

Hydra Launcher is the visual and architectural reference requested for this project. This launcher will not reuse Hydra's torrent, account, cloud, social, achievement, telemetry, or other excluded features.
