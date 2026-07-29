# Phase 1 Handoff

## Current state

Phase 1 is complete. The project has a runnable Electron desktop shell, React + Tailwind renderer, local FastAPI service, and a single end-to-end health check. It deliberately has no SQLite database, game model, scanner, executable launcher, metadata provider, or artwork cache.

## Hydra source reuse guidance

The local [Hydra source repository](C:\projects\hydra-main) may be used as an implementation resource in later phases, especially its React renderer in `src/renderer/src`. Its component organization, page layouts, reusable UI patterns, Electron/preload boundary, and styling techniques are useful references and may be adapted where they fit this project's architecture.

Hydra is MIT-licensed. When copying or substantially adapting code, retain the applicable license and attribution notices. Do not bring over functionality that is outside this project's approved scope: torrents/download sources, piracy-related flows, accounts, cloud sync, friends, achievements, telemetry, online backends, or update services. Keep The Launcher's FastAPI-first business-logic boundary intact even when adapting frontend code.

## What changed

- Electron starts the FastAPI service as a local child process and stops it when Electron quits.
- The preload bridge exposes only `window.launcher.getBackendHealth()`.
- The renderer displays a Hydra-inspired foundation screen and the local service state.
- FastAPI serves `GET http://127.0.0.1:8765/health`.

## Test Phase 1 before moving to Phase 2

### Prerequisites

- Node.js 22 or newer
- Python 3.12 or newer with `pip`
- A Python environment that contains FastAPI and Uvicorn

### 1. Install dependencies

```powershell
npm install
python -m pip install -r backend\requirements.txt
```

If `python` points to a different interpreter, use the full interpreter path instead:

```powershell
& 'C:\path\to\python.exe' -m pip install -r backend\requirements.txt
```

### 2. Verify automated checks

```powershell
npm run typecheck
npm run build
& 'C:\path\to\python.exe' -m pytest backend\tests
```

Expected results: both npm commands exit with code 0; pytest reports one passing health test.

### 3. Test the backend directly

In one terminal:

```powershell
& 'C:\path\to\python.exe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765
```

In another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/health
```

Expected response:

```text
status  service
------  -------
ok      backend
```

Stop Uvicorn with `Ctrl+C` after the check.

### 4. Test the Electron-to-backend integration manually

Set the interpreter Electron should use, then start development mode:

```powershell
$env:ELECTRON_RUN_AS_NODE = $null
$env:PYTHON_EXECUTABLE = 'C:\path\to\python.exe'
npm run dev
```

Expected behavior:

1. A desktop window titled **The Launcher** appears.
2. The Home screen shows **Foundation verified**.
3. Its status pill changes to **Local service ready**.
4. Closing the Electron window exits the Electron process and its spawned FastAPI child process.

If the status shows unavailable, inspect the terminal for `[backend]` output. The usual causes are missing Python dependencies or an incorrect `PYTHON_EXECUTABLE` path.

If Electron prints a Node stack trace and no window opens, check that `ELECTRON_RUN_AS_NODE` is unset as shown above. That environment variable forces Electron to run as Node rather than as a desktop application.

## Next phase: Phase 2

Implement only the persistence foundation:

1. Add SQLAlchemy configuration and session lifecycle in FastAPI.
2. Add Alembic and establish the first migration.
3. Create the initial database models and Pydantic schemas.
4. Add a small, tested CRUD API slice.
5. Keep Electron and React changes limited to any necessary typed contract/health visibility; do not build the game-library UI until Phase 3.

## Suggested commit

`feat(foundation): establish Electron React and FastAPI shell`
