# Phase 6 Handoff — Metadata & Cover Artwork Completed

## Current State

## Phase 6 Update: Metadata & Cover Artwork Completed

Phase 6 is complete and verified. Games can be queued for optional IGDB enrichment; matched descriptions, release dates, genres, confidence, and locally cached cover artwork are persisted in SQLite. Scanner imports enqueue background metadata work without blocking their atomic import.

### Verification

- `npm run build` passed, including `npm run typecheck`.
- `python -m pytest backend/tests -q` passed: 22 tests covering metadata, CRUD, session/launch lifecycle, migrations, and scanner regression.

### Phase 6 additions

- `MetadataService`, `MetadataProvider`, `IGDBProvider`, `OAuthManager`, `ArtworkDownloader`, `CacheManager`, matching, and a background queue.
- Local metadata queue/status/refresh/cover API endpoints, plus narrow Electron metadata IPC and completion notifications.
- Cover artwork and metadata controls/details in the renderer, without exposing cover filesystem paths for rendering.
- Twitch credentials are configured in `backend/.env`; without valid credentials metadata endpoints return a clear local configuration error while the rest of the launcher remains usable.

---

Phase 6 is complete and verified. Local games can be enriched with optional IGDB metadata through the existing background queue. Matched descriptions, release dates, genres, confidence, and validated cover artwork are stored locally; scanner imports enqueue metadata only when credentials are configured and never block local imports.

---

## Verification

Run all verification checks from a terminal:

```powershell
# 1. Full production build (typecheck + electron-vite)
npm run build

# 2. Backend, metadata, CRUD, launch/session, migration, and scanner tests
py -3 -m pytest backend/tests -q

# 3. Launch dev server
$env:PYTHON_EXECUTABLE="C:\Users\vinsa\AppData\Local\Programs\Python\Python312\python.exe"
npm run dev
```

Expected results:
- Production build succeeds cleanly.
- All 22 pytest tests pass in ~2s.
- Dev app starts up without CORS or python executable errors.

---

## What Was Completed in Phase 6

### Backend (Metadata Service & API)
- Completed the existing `MetadataService`, `MetadataProvider`, `IGDBProvider`, `OAuthManager`, `ArtworkDownloader`, `CacheManager`, title matching, and background queue integration.
- Registered metadata queue, status, refresh, and local cover endpoints under `/api/v1/metadata`.
- Added Alembic revision `20260802_01_add_metadata_fields` for IGDB ID, source, confidence, and genres.
- Kept scanner imports atomic and made automatic metadata queueing conditional on configured credentials.

### Electron & Renderer
- Added typed metadata HTTP methods, IPC queueing, and completion notifications.
- Added cover rendering, metadata fetch/retry controls, and read-only metadata details in the library UI.
- Cover artwork is rendered through the local API rather than exposing filesystem paths to the renderer.

### Regression coverage
- Added metadata API tests and restored executable-derived scanner display names after Phase 6 normalization changed the existing scanner contract.

## Previous Phase 5 Work

### Backend (Scanner Service & API)
- Added `ScannerService` in-memory state machine with states: scanning, completed, cancelled, failed.
- Added `ExecutableDetector` centralising `.exe` identification and exclusion heuristics for uninstallers, updaters, launchers, installers, redistributables, crash reporters, SFV checkers, language selectors, config utilities, patchers, anti-cheat, and helpers.
- Added iterative, cancellable recursive traversal with `os.scandir()`, progress counters, and non-fatal permission warnings.
- Scanner skips symlinks/junctions, hidden/system directories, and common non-game engine directories (`engine`, `plugins`, `redist`, `_commonredist`, `support`, `dependencies`, `directx`, `dotnet`).
- Added scan-scoped review candidates with display name, executable path, root folder, duplicate state, skip reason, file size, and modification time.
- Added atomic batch import: scanning never writes to the database; confirmed imports commit together or roll back together.
- Added Pydantic schemas: `ScanStartRequest`, `ScanCandidateResponse`, `ScanSummaryResponse`, `ScanStatusResponse`, `ScanImportRequest`, `ScanImportResponse`.
- Added 4 FastAPI endpoints under `/api/v1/scanner`: `POST /scans`, `GET /scans/{scan_id}`, `POST /scans/{scan_id}/cancel`, `POST /scans/{scan_id}/imports`.
- Added 4 scanner tests in `test_scanner_api.py` covering nested folder discovery, executable exclusions, already-imported detection, batch import with skipping, cross-scan candidate rejection, and cancellation.

### Electron Main (Scanner IPC Bridge & Launch Lifecycle Tracking)
- Added native multi-folder picker using `dialog.showOpenDialog()` with `openDirectory` and `multiSelections`.
- Added `monitorScan()` polling loop (300ms interval) that forwards scanner state to the renderer.
- Added 4 scanner IPC handlers: `scanner:pick-folders`, `scanner:start`, `scanner:cancel`, `scanner:import`.
- Added 4 typed scanner event channels: `scanner:progress`, `scanner:completed`, `scanner:cancelled`, `scanner:failed`.
- Updated `GameLauncher`:
  - Uses Electron's native `shell.openPath` for launching games in full interactive desktop GUI mode.
  - Active background process monitoring via Windows `tasklist` polling to track gameplay duration for standard executables as well as cracked games and launcher wrappers.
  - Automatically completes sessions in FastAPI and notifies renderer (`game:exited`) when games close, updating Recently Played playtime.
- Extended `backend-client.ts` with scanner HTTP methods.

### Preload & Renderer (Scanner UI)
- Added `src/renderer/src/types/scanner.ts`: Typed scanner domain types.
- Added `src/renderer/src/hooks/useFolderScanner.ts`: Hook managing scan lifecycle, IPC event subscriptions, import state, and dismissal.
- Added `src/renderer/src/components/library/ScanFoldersDialog.tsx`: Review dialog with scanning progress, candidate list, multi-select checkboxes, summary statistics, cancellation, and import action.
- Updated `LibraryPage.tsx`: Added "Scan folders" button, integrated `useFolderScanner` hook, wired `ScanFoldersDialog`, and added library refresh after import.

---

## Files Added in Phase 5

- `backend/app/scanner.py`
- `backend/app/api/v1/scanner.py`
- `backend/tests/test_scanner_api.py`
- `src/renderer/src/types/scanner.ts`
- `src/renderer/src/hooks/useFolderScanner.ts`
- `src/renderer/src/components/library/ScanFoldersDialog.tsx`

## Files Modified in Phase 5

- `backend/app/schemas.py` — Added scanner Pydantic schemas.
- `backend/app/api/v1/router.py` — Registered scanner router.
- `src/main/index.ts` — Added scanner IPC handlers, polling, and cleanup.
- `src/main/backend-client.ts` — Added scanner HTTP client methods and types.
- `src/main/game-launcher.ts` — Implemented native shell launching and active process monitor.
- `src/preload/index.ts` — Added scanner IPC bridge.
- `src/renderer/src/vite-env.d.ts` — Added scanner type declarations.
- `src/renderer/src/pages/LibraryPage.tsx` — Integrated scanner UI.

---

## Prior Phase Summaries

### Phase 4 (Launching & Sessions)
- `GameLauncher` class with path validation, duplicate launch checks, PID tracking, session creation, and `game:exited` events.
- `useRecentGames` hook and `RecentlyPlayed` UI section.
- "Open File Location" via `explorer.exe /select,<path>`.

---

## Known Limitations

- **Single game launch**: Only one instance of a given game can be launched at a time (by design).
- **Open File Location**: Windows-only (`explorer.exe`).
- **Scanner state**: Not persisted across application restarts.
- **Exclusion rules**: Built in; not yet user configurable.
- **Single-worker scanning**: Intentional to keep disk contention predictable.

---

## Architecture Constraints (Preserved)
- **Zero SQLite access in Electron**: Electron communicates solely with FastAPI HTTP endpoints.
- **Separation of Responsibilities**: Renderer handles UI rendering; Electron manages desktop integration, IPC, and backend communication; FastAPI handles business logic, scanning, and SQLite persistence.
- **IPC Handler Scoping**: `index.ts` remains a thin wiring layer — all logic lives in dedicated modules.
- **Security**: Renderer only sends game IDs and candidate IDs through IPC. File paths are never exposed to the renderer.

---

## Next Phase: Phase 7 — Statistics

Build local library statistics and insights without redesigning the completed metadata architecture.
