# Phase 1 — Runnable Desktop Foundation

## Why this phase exists

The project needed a verified delivery path before library features can safely be added. This phase establishes the Electron desktop process, React renderer, FastAPI process boundary, styling baseline, and a minimal end-to-end connection.

## Completed features

- Electron desktop window with a production-oriented security baseline.
- React + TypeScript renderer with a Tailwind-powered Hydra-inspired shell.
- Typed, allow-listed preload bridge: `window.launcher.getBackendHealth()`.
- FastAPI local health endpoint: `GET /health`.
- Electron-managed FastAPI child process in development.
- TypeScript typecheck, Electron/Vite production build, and backend health test.

## Architecture decisions

- React receives backend state through the Electron IPC bridge rather than calling privileged resources directly.
- FastAPI is responsible for application/business behavior; Phase 1 contains only a health signal.
- The renderer has a static foundation display only. Navigation controls other than Home are visibly deferred and have no misleading placeholder behavior.
- The FastAPI process binds to `127.0.0.1:8765`, not an external network interface.

## Important files

| File | Responsibility |
| --- | --- |
| `src/main/index.ts` | Secure Electron window creation, IPC registration, backend lifecycle. |
| `src/main/backend-process.ts` | Starts/stops FastAPI and polls `/health`. |
| `src/preload/index.ts` | Narrow typed IPC API exposed to the renderer. |
| `src/renderer/src/app.tsx` | Phase 1 desktop shell and backend status display. |
| `src/renderer/src/styles.css` | Tailwind entry and small global style rules. |
| `backend/app/main.py` | FastAPI application and health endpoint. |
| `backend/tests/test_health.py` | Health endpoint test. |

## API endpoints

| Method | Path | Status |
| --- | --- | --- |
| `GET` | `/health` | Implemented |

## Database changes

None. Phase 2 owns SQLite, SQLAlchemy models, and migrations.

## Verification completed

- `npm run typecheck` passed.
- `npm run build` passed.
- Python health test passed using Python 3.12.

## Known issues / operational notes

- The current workstation resolves `python` to an MSYS Python installation without `pip`. Use a Python environment with FastAPI installed and set `PYTHON_EXECUTABLE` if necessary.
- This workstation also exports `ELECTRON_RUN_AS_NODE=1`; unset it before `npm run dev` or Electron will not create a window.
- SQLAlchemy, httpx, and Pillow are intentionally not installed yet. They are introduced only in their owning phases, beginning with SQLAlchemy in Phase 2 and artwork dependencies in Phase 6.
- Packaging an embedded Python runtime is intentionally deferred to Phase 10. The current `electron-builder` configuration copies backend source only.

## Current folder structure

```text
thelauncher/
├── backend/
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── docs/
├── src/
│   ├── main/
│   ├── preload/
│   └── renderer/
├── electron-builder.yml
├── electron.vite.config.ts
├── package.json
└── handoff.md
```

## How to continue development

Start Phase 2 only after approval. Add SQLAlchemy engine/session configuration, Alembic migrations, and a minimal settings or games persistence slice. Keep FastAPI route handlers thin and do not introduce library UI beyond the data contract needed for Phase 2.

## Suggested commit

`feat(foundation): establish Electron React and FastAPI shell`
