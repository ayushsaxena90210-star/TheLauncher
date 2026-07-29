# The Launcher

An offline-first desktop game launcher being built as a portfolio-quality software engineering project. It will manage locally installed games, scan selected folders, launch executables, enrich games with metadata and cover art, and track playtime.

## Status

**Phase 1 complete.** The Electron shell, React renderer, Tailwind theme, and local FastAPI health service are runnable. No database or game-library feature exists yet.

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
Electron main process (windows, dialogs, executable launch)
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

Phase 1 established the runnable Electron + React + FastAPI development environment, base theme, and local health connection. Phase 2 will add the persistence foundation. Subsequent phases cover the game library, launching, scanning, metadata/artwork, statistics, settings, polish, and packaging.

See [Roadmap](docs/ROADMAP.md), [Phase 1 notes](docs/Phase1.md), and the [Phase 1 handoff](handoff.md).

## Screenshots

Placeholder — the Phase 1 foundation screen exists; portfolio screenshots will be added after the library UI is implemented.

## Current API endpoints

`GET /health` is available locally. The remaining endpoint contract is proposed in [API.md](docs/API.md).

## Database schema

No database exists yet. Phase 2 will introduce SQLite and migrations; the proposed schema is documented in [DATABASE.md](docs/DATABASE.md).

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

Game management, persistence, scanning, executable launching, and metadata/artwork are intentionally not implemented yet.

## Credits

Hydra Launcher is the visual and architectural reference requested for this project. This launcher will not reuse Hydra's torrent, account, cloud, social, achievement, telemetry, or other excluded features.
