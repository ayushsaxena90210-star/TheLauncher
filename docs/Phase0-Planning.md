# Phase 0 — Planning and Repository Setup

## Purpose

This phase creates a clean, documented starting point before implementation. It prevents scope drift and gives a later developer an explicit architecture, data model, API direction, and phase boundary.

## Completed work

- Created the agreed top-level folders: `src`, `backend`, `assets`, `database`, and `docs`.
- Added repository hygiene with `.gitignore`.
- Created the living README and project handoff documentation.
- Reviewed Hydra Launcher as a reference: Electron main process, secure preload IPC bridge, React renderer, and separate Big Picture UI.
- Defined a deliberately smaller offline-only scope.

## Architecture decisions

- Electron remains a thin desktop integration layer: window lifecycle, native dialogs, IPC, notifications, and launching executables.
- React remains a presentation layer; it must call typed IPC/API clients rather than own business rules.
- FastAPI owns scanning, SQLite access, metadata/artwork caching, search, statistics, and validation.
- SQLite is the single source of truth. Artwork files live under `assets/cache` and are referenced from SQLite.
- Hydra is a UX/reference source only; no Hydra code or excluded functionality is in scope.

## Current folder structure

```text
thelauncher/
├── assets/
├── backend/
├── database/
├── docs/
├── src/
├── .gitignore
├── README.md
└── theprompt.md
```

## API and database changes

None implemented. Proposed contracts and schema are recorded in `API.md` and `DATABASE.md`.

## Known issues

- The repository does not yet contain a runnable app, dependency manifests, or tests by design.
- The metadata provider and its user-supplied API-key strategy must be finalized during Phase 1 before any metadata feature is built.

## How to continue

Begin Phase 1 only after approval. Create a minimal runnable Electron + React + FastAPI workspace, preserve the stated folder boundary, introduce Tailwind and a Hydra-inspired theme system, and prove the three processes can communicate through a health check.

Do not implement SQLite models, game CRUD, scanners, game launching, or metadata fetching during Phase 1.

## Suggested commit

`chore(project): establish architecture and planning foundation`
