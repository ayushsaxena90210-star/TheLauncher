# Phase 3 Handoff

## Current state

Phase 3 is complete. The React renderer now provides a responsive local game library with manual add, edit, delete, search, and loading/empty/error states, backed by the existing FastAPI games API.

## Verify Phase 3

```powershell
npm run build
& 'C:\path\to\python.exe' -m pytest backend\tests -q
```

Expected results: the production build succeeds and pytest reports six passing tests.

To run the backend directly:

```powershell
& 'C:\path\to\python.exe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765
```

FastAPI applies `20260729_01_create_games` on startup. In development it creates `database/the-launcher.db`; set `LAUNCHER_DATABASE_PATH` to override that location. Packaged Electron provides a per-user path automatically.

## What changed

- Added a typed renderer API client, games service layer, and reusable games CRUD hooks.
- Added reusable game cards/grid, loading, empty, and error states, and a shared add/edit form dialog.
- Added delete confirmation and client-side title filtering.
- Added restricted CORS for only Vite's standard local development origins.
- Kept SQLite schema and FastAPI games business logic unchanged.

## Next phase: Phase 4

Phase 4 is not started. Its scope is executable launching, persisted play sessions, and recently played games only.

### Acceptance criteria

- Add a Play button to each game card.
- The renderer calls a typed preload IPC method such as `window.launcher.launchGame(gameId)`.
- Electron main retrieves the game through the local FastAPI API, validates the executable path, and launches it with `spawn`; never construct a shell command.
- FastAPI creates a play-session record only after Electron successfully starts the process.
- When the child process exits, Electron calls FastAPI to complete the session and record its duration.
- Show launching and launch-error states in the UI, then refresh recently played data.

### Required architecture

```text
React Play button
  -> typed preload IPC
  -> Electron main validates and spawns executable
  -> FastAPI session API
  -> SQLite session record
```

- React must not launch executables directly.
- Electron must not access or mutate SQLite directly.
- FastAPI must not launch executables through a shell.
- Preserve `contextIsolation`, disabled renderer Node integration, and a minimal allow-listed preload bridge.

### Backend work

1. Add a `game_sessions` SQLAlchemy model.
2. Add a versioned Alembic migration; do not alter the existing `games` schema unless a genuine defect requires it.
3. Add FastAPI session-start and session-completion endpoints, use cases, and tests.
4. Store a game reference, started timestamp, ended timestamp, and calculated duration.

### Electron work

1. Add a main-process local API helper to retrieve a game by ID.
2. Validate IPC input and verify the resolved executable path before launch.
3. Use `child_process.spawn(executablePath, [], options)` without a shell.
4. Start the backend session only after spawning succeeds.
5. Complete that session from the child-process exit handler.

### Renderer work

1. Add a reusable Play control to `GameCard`.
2. Add disabled launching and actionable error states.
3. Add a narrowly scoped recently-played view or indicator.
4. Keep all launch calls behind the typed preload bridge; do not put Electron or backend calls directly in components.

### Verification

After each major milestone, run:

```powershell
npm run build
& 'C:\path\to\python.exe' -m pytest backend\tests -q
npm run dev
```

Manually verify with a known safe local executable that it starts, its process exit closes the matching session, and the persisted duration is correct. Test invalid/missing executable paths, launch failures, repeated launches, and app shutdown while a game is running.

Do not implement folder scanning, metadata/artwork, statistics, settings, favourites, or any other later-phase work during Phase 4.

## Suggested commit

`feat(library): add game library management experience`
