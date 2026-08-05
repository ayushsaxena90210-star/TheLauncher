# Phase 8 — Settings & Desktop Experience

## Milestone A completed

- Added FastAPI-owned SQLite persistence for local key/value settings and saved scan roots through migration `20260805_01`.
- Added theme preferences (`light`, `dark`, and `system`) with immediate renderer switching and durable storage.
- Added a Concept A Settings Workspace: secondary in-workspace navigation, status row, Appearance, Library, Metadata Provider, Cache, and future Desktop sections.
- Added safe scan-root add/remove and saved-root rescan handoff to the existing Electron scanner IPC.
- Added provider-neutral metadata status; IGDB is reported as the active provider without exposing credentials.
- Added artwork-cache statistics, clear, and orphan rebuild operations. They are bounded to the configured cache directory and never target game installations.
- Added frameless-title-bar minimize, maximize/restore, and close IPC controls, preserving Windows hover behavior and drag regions.

## Files added

- `backend/app/settings_service.py`
- `backend/app/api/v1/settings.py`
- `backend/alembic/versions/20260805_01_add_settings_and_scan_roots.py`
- `backend/tests/test_settings_api.py`
- `src/renderer/src/hooks/useSettings.ts`
- `src/renderer/src/pages/SettingsPage.tsx`
- `src/renderer/src/types/settings.ts`
- `src/renderer/src/settings.css`

## Verification

- `npm run build` (includes type checking)
- `python -m pytest backend/tests -q --basetemp C:\projects\pytest-phase8-basetemp` — 25 passed

## Known limitations / follow-up

- The Desktop category intentionally reserves startup and window-behavior preferences; it does not change startup behavior in Milestone A.
- A manual Electron visual smoke test remains recommended for title-bar behavior on the target Windows environment.
