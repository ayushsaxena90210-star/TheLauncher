# Phase 5 — Automatic Folder Scanner

## Completed work

- Added an Electron native multi-folder picker and typed, narrow scanner IPC bridge.
- Added an in-memory FastAPI scanner state machine: scanning, completed, cancelled, and failed.
- Added iterative, cancellable recursive traversal with progress counters and non-fatal permission warnings.
- Added `ExecutableDetector`, centralising `.exe` identification and exclusions for uninstallers, updaters, launchers, installers, SFV checkers, language selectors, configuration utilities, patchers, anti-cheat, and helper tools.
- Scanner does not follow symbolic links/junctions and skips hidden/system and common irrelevant directories.
- Added scan-scoped review candidates with display name, executable path, root, duplicate state, skip reason, file size, and modification time.
- Added a review dialog with multi-selection, cancellation, scan summary, and explicit import action.
- Added atomic batch import: discovery never writes the database; confirmed imports commit together or roll back together.
- Electron performs all backend status polling and emits typed IPC events. The renderer is event-driven and never accesses the filesystem.

## Files added

- `backend/app/scanner.py`
- `backend/app/api/v1/scanner.py`
- `backend/tests/test_scanner_api.py`
- `src/renderer/src/types/scanner.ts`
- `src/renderer/src/hooks/useFolderScanner.ts`
- `src/renderer/src/components/library/ScanFoldersDialog.tsx`

## Architecture notes

No database migration was needed. Jobs and candidates are intentionally in-memory and lost when the local backend stops. Candidate IDs are valid only for the `scan_id` that created them. FastAPI owns scanning, validation, and persistence; Electron owns native dialogs, HTTP polling, and IPC; React renders state only.

## Testing performed

- `npm run typecheck`
- Backend API and scanner tests, including nested folders, executable exclusions, already-imported games, atomic selected import, and cross-scan candidate rejection.

## Known limitations

- Scanner state is not persisted across application restarts.
- Exclusion patterns are built in and are not yet user configurable.
- Scanning is intentionally single-worker to keep disk contention predictable.

## Future improvements

- [ ] Folder watching
- [ ] Scheduled rescans
- [ ] Configurable exclusions
- [ ] Metadata-assisted matching
- [ ] Parallel scanning
- [ ] Incremental rescans
