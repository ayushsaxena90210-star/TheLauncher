# Project Journal

## 2026-07-29 — Planning foundation

- Reviewed the requested Hydra Launcher reference. Its main codebase uses Electron with a preload bridge and React renderer, plus a separate Big Picture renderer.
- Defined The Launcher as an independent, offline-first project with a smaller feature set.
- Created planning documents and an empty directory scaffold only. No code or dependency setup has been added.
- Next decision point: approve Phase 1 and choose the initial metadata provider configuration approach before metadata work begins later.

## 2026-07-29 — Phase 1 foundation

- Added electron-vite, Electron, React, TypeScript, Tailwind, FastAPI, and the initial build/test commands.
- Implemented a secure Electron window, an allow-listed preload bridge, and one IPC method for backend health.
- Electron starts FastAPI as a child process and the renderer displays its readiness state.
- Added one backend health test and completed TypeScript and production-build verification.
- No SQLite models, migrations, CRUD, scanning, launch, metadata, or artwork features were added.

## 2026-07-29 â€” Phase 2 persistence foundation

- Added SQLAlchemy SQLite configuration, per-request sessions, and Alembic migration support.
- Added the initial `games` table and migration `20260729_01_create_games`.
- Added a small `/api/v1/games` CRUD contract with schema validation, stable errors, repository/service separation, and isolated SQLite tests.
- FastAPI now applies versioned migrations on startup; Electron provides a per-user database path in packaged mode while development defaults to `database/the-launcher.db`.
- No game-library UI, scanner, launcher, metadata, or statistics functionality was added.
