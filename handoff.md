# Project Handoff — Phase 9 Complete

## Current status

Phases 1–9 are complete. The launcher is an offline-first Electron desktop application with a React renderer, typed preload IPC, FastAPI business logic, and SQLite persistence.

Phase 9 delivered the UI polish, design system, and desktop experience pass:

- **`design-system.css`** — single source of truth for all tokens (colour, spacing, radius, shadow, motion, z-index).
- **Six accent colour presets** (Cyan, Indigo, Violet, Emerald, Amber, Rose) persisted to SQLite and applied via `data-accent` on `<html>`.
- **Full light/dark/system theme support** across every page and component.
- **Reduced-motion** — respects `prefers-reduced-motion` and a manual Settings toggle; persisted to SQLite.
- **Two-panel shell** — Hydra-inspired `AppSidebar` with brand row, navigation, scrollable game list (thumbnail + title + genre), and Settings link.
- **`GameContext`** — shared game list; eliminates duplicate IPC fetches between sidebar and page content.
- **Unified UI primitives** — `Button`, `Dialog` (focus-trapped, Escape-handled), `Skeleton`, `EmptyState`, `ErrorState`.
- **All dialogs migrated** to the `Dialog` primitive (focus trap + backdrop click).
- **`GameCard` play button** uses accent CSS variables instead of hardcoded gradient.
- **Backend** — `accent_color` and `reduced_motion` added to `SettingsResponse` / `SettingsUpdate` schema with no new migrations required.

The existing library, scanner, launcher/session tracking, metadata pipeline, cached artwork, and Game Details page are stable and have not been restructured.

## Architecture constraints

```text
React renderer (UI)
        ↓ typed preload IPC
Electron main (native window, dialogs, launch integration)
        ↓ local HTTP
FastAPI (business logic, validation, cache/scanner/metadata services)
        ↓
SQLite + managed local artwork cache
```

- Electron must not access SQLite directly.
- Keep credentials out of renderer payloads and persistent settings.
- Continue using versioned Alembic migrations for schema changes.
- Hydra remains visual inspiration only; do not copy its code, assets, or architecture.
- `design-system.css` is the single source of truth — raw hex/px values must not appear in component CSS.

## Key file reference

| File | Role |
|---|---|
| `src/renderer/src/design-system.css` | All design tokens and CSS component classes |
| `src/renderer/src/context/GameContext.tsx` | Shared game list; wrap with `<GameProvider>` |
| `src/renderer/src/components/ui/` | Button, Dialog, Skeleton, EmptyState, ErrorState |
| `src/renderer/src/components/shell/AppSidebar.tsx` | Sidebar with game list |
| `src/renderer/src/app.tsx` | Root shell; applies theme/accent/motion to `<html>` |
| `src/renderer/src/vite-env.d.ts` | Window global types (incl. `AppSettings`, `AccentColor`) |
| `backend/app/schemas.py` | `SettingsResponse` / `SettingsUpdate` |
| `backend/app/settings_service.py` | Reads/writes accent + reduced_motion |
| `docs/Phase9.md` | Full Phase 9 change log and design decisions |

## Verification baseline

- `npm run typecheck` → 0 errors
- `npm run build` → Vite 782 kB bundle, 0 errors
- `pytest backend/tests/ -q` → 25 / 25 passed

For a local Windows run:

```powershell
$env:PYTHON_EXECUTABLE="C:\Users\vinsa\AppData\Local\Programs\Python\Python312\python.exe"
npm run dev
```

## Manual smoke-test checklist

- [ ] App starts; sidebar shows brand + Library nav active
- [ ] Sidebar game list populates; clicking a game opens Game Details
- [ ] Add game via Library → Add game; game appears in sidebar list
- [ ] Scan folders: scan starts, candidates appear, import works
- [ ] Settings → Appearance: theme toggle switches live (Light / Dark / System)
- [ ] Settings → Appearance: accent colour changes accent throughout UI
- [ ] Settings → Appearance: Reduce motion toggle disables animations
- [ ] Settings → Scan folders: add/remove saved folder; Rescan triggers the scan dialog
- [ ] Settings → Cache: stats display; Clear cache asks for confirmation
- [ ] Game Details: Play button launches the game; session is recorded
- [ ] Title-bar minimize/maximize/close all function correctly
- [ ] All dialogs: Escape closes; Tab cycles focus; backdrop click closes
- [ ] Light theme: text is readable on light backgrounds; no dark-only hardcoded colours
- [ ] Focus indicators visible on all interactive elements (keyboard nav)

## What is explicitly out of scope

- Cloud sync, accounts, friends, achievements
- Plugins, auto-updates
- Packaging / installer
- The Discover tab (button visible but disabled)
