# Phase 9 — UI Polish, Design System & Desktop Experience

## Overview

Phase 9 replaced the patchwork of ad-hoc Tailwind utility classes and one-off component styles with a **single, centrally-managed design system** and a **Hydra-inspired two-panel desktop shell**. The goal was a cohesive, premium-looking application where every visual decision traces back to one source of truth.

---

## Scope

| Area | Status |
|---|---|
| Design system CSS (`design-system.css`) | ✅ Complete |
| Two-panel app shell + AppSidebar | ✅ Complete |
| Theme (dark / light / system) | ✅ Complete |
| Accent colour picker (6 presets) | ✅ Complete |
| Reduced-motion support | ✅ Complete |
| `Button`, `Dialog`, `Skeleton`, `EmptyState`, `ErrorState` primitives | ✅ Complete |
| `GameContext` (shared library source) | ✅ Complete |
| LibraryPage redesign | ✅ Complete |
| GameDetailsPage redesign | ✅ Complete |
| SettingsPage redesign | ✅ Complete |
| All dialogs migrated to `Dialog` primitive | ✅ Complete |
| `GameCard` unified play button (accent tokens) | ✅ Complete |
| Backend `accent_color` + `reduced_motion` persistence | ✅ Complete |
| Typecheck | ✅ 0 errors |
| Build | ✅ Passes |
| pytest | ✅ 25 / 25 |

---

## Architecture Changes

### 1. `design-system.css` (new)

The single source of truth for:

- **Accent colour tokens** via `data-accent` attribute on `<html>` (`cyan`, `indigo`, `violet`, `emerald`, `amber`, `rose`)
- **Dark and light theme tokens** via `data-theme` attribute
- **Reduced-motion overrides** via `data-reduced-motion` attribute and `prefers-reduced-motion` media query
- **Layout primitives:** `.app-shell`, `.app-layout`, `.app-sidebar`, `.app-content`
- **Sidebar classes:** `.sidebar-*`
- **Button classes:** `.btn`, `.btn--primary`, `.btn--quiet`, `.btn--danger`, `.btn--ghost`, `.btn--icon`
- **Dialog classes:** `.dialog-backdrop`, `.dialog-panel`
- **Skeleton:** `.skeleton` (CSS animation)
- **Cards:** `.ds-card`
- **Form inputs:** `.ds-input`
- **Menus:** `.ds-menu`, `.ds-menu-item`
- **Toggles:** `.ds-toggle`
- **Settings workspace:** `.settings-*`
- **Status pills:** `.status-pill`
- **Typography helpers:** `.page-eyebrow`, `.eyebrow`
- **Motion tokens:** `--duration-fast/base/slow`, `--ease-default`, `--ease-spring`
- **Shadow tokens:** `--shadow-card`, `--shadow-dialog`, `--shadow-sm`
- **Radius tokens:** `--radius-sm/md/lg/xl/2xl/full`
- **Z-index scale:** `--z-sidebar`, `--z-titlebar`, `--z-dialog`

### 2. `app.tsx` (rewritten)

- Loads settings from IPC on mount and applies theme, accent, reduced-motion to `<html>` attributes
- Provides `GameProvider` + `AppSidebar` wrapping all routes
- `toggleMaximizeWindow` now correctly toggles the maximize/restore icon via returned boolean

### 3. `context/GameContext.tsx` (new)

Wraps the existing `useGames` hook and derives `activeGameId` from the URL. All pages/components read games from here — eliminates duplicate fetches between the sidebar game list and page content.

### 4. UI Primitives (new in `components/ui/`)

| Component | Purpose |
|---|---|
| `Button.tsx` | Unified interactive element (5 variants × 3 sizes) |
| `Dialog.tsx` | Accessible modal with focus trap + Escape handler |
| `Skeleton.tsx` | Animated content placeholder |
| `EmptyState.tsx` | Generic empty state with icon/action |
| `ErrorState.tsx` | Generic error display (full-page + compact inline) |

### 5. `components/shell/AppSidebar.tsx` (new)

Hydra-inspired sidebar with:
- Brand/logo row
- Navigation items (Library, Settings; Discover stubbed/disabled for post-Phase-9)
- Scrollable game list with cover thumbnail, title, and genre tag
- Inline filter input

### 6. Backend (`schemas.py`, `settings_service.py`)

Added `accent_color` (default `"cyan"`) and `reduced_motion` (default `false`) to `SettingsResponse` and `SettingsUpdate`.

---

## Files Changed

### New Files

| File | Description |
|---|---|
| `src/renderer/src/design-system.css` | Design token system |
| `src/renderer/src/context/GameContext.tsx` | Shared game list context |
| `src/renderer/src/hooks/useReducedMotion.ts` | OS + data-attribute reduced-motion hook |
| `src/renderer/src/components/ui/Button.tsx` | Unified button primitive |
| `src/renderer/src/components/ui/Dialog.tsx` | Accessible dialog primitive |
| `src/renderer/src/components/ui/Skeleton.tsx` | Skeleton loader primitive |
| `src/renderer/src/components/ui/EmptyState.tsx` | Generic empty state |
| `src/renderer/src/components/ui/ErrorState.tsx` | Generic error state |
| `src/renderer/src/components/shell/AppSidebar.tsx` | Sidebar with game list |

### Modified Files

| File | Change |
|---|---|
| `src/renderer/src/app.tsx` | Two-panel shell, accent/motion application |
| `src/renderer/src/main.tsx` | `design-system.css` import first |
| `src/renderer/src/styles.css` | Stripped to resets only |
| `src/renderer/src/settings.css` | Emptied (migrated to design-system) |
| `src/renderer/src/vite-env.d.ts` | `AccentColor`, `AppSettings` types added |
| `src/preload/index.ts` | `AccentColor`, `AppSettings` types added |
| `src/renderer/src/types/settings.ts` | `AccentColor`, `AppSettings` exported |
| `src/renderer/src/hooks/useSettings.ts` | Cast for IPC type bridge |
| `src/renderer/src/pages/LibraryPage.tsx` | Uses `GameContext`, new primitives |
| `src/renderer/src/pages/GameDetailsPage.tsx` | Skeleton, ErrorState, token-based styles |
| `src/renderer/src/pages/SettingsPage.tsx` | Accent picker, reduced-motion toggle, Button primitives |
| `src/renderer/src/components/library/GameDialog.tsx` | Dialog + Button primitives |
| `src/renderer/src/components/library/DeleteGameDialog.tsx` | Dialog + Button primitives |
| `src/renderer/src/components/library/ScanFoldersDialog.tsx` | Dialog + Button primitives |
| `src/renderer/src/components/library/GameCard.tsx` | Unified play button via accent tokens |
| `src/renderer/src/components/library/EmptyState.tsx` | Shim → `ui/EmptyState` |
| `src/renderer/src/components/library/ErrorState.tsx` | Shim → `ui/ErrorState` |
| `backend/app/schemas.py` | `accent_color`, `reduced_motion` fields |
| `backend/app/settings_service.py` | Read/write new settings keys |
| `backend/tests/test_settings_api.py` | Updated expected JSON for new fields |

---

## Design Decisions

### Accent-raw HSL splitting
The accent colour is stored as `--accent-raw: H S% L%` (without `hsl()`) so it can be used in both `hsl(var(--accent-raw))` and `hsl(var(--accent-raw) / 0.15)` alpha variants without calc tricks. The six presets (Cyan, Indigo, Violet, Emerald, Amber, Rose) are applied via `document.documentElement.dataset.accent`.

### GameContext vs repeated `useGames` calls
Before Phase 9, the sidebar, LibraryPage, and StatisticsPage each fetched games independently. `GameContext` wraps `useGames` once and serves the result to all consumers. `activeGameId` is derived from the URL so the URL stays the single source of truth for navigation.

### Focus trap in Dialog
The `Dialog` primitive implements its own Tab-cycle focus trap without any external library. It queries all focusable elements inside the panel on each keydown and cycles between first/last.

### No breaking changes to the backend REST API
`accent_color` and `reduced_motion` use `None`-default update semantics identical to the existing `theme` field — no database migration is required because settings are stored as JSON key-value pairs in the `settings` table.

---

## Verification

```
npm run typecheck  →  0 errors
npm run build      →  Vite 782 kB bundle, 0 errors
pytest (25 tests)  →  25 passed
```

---

## What Was Explicitly Not Implemented

Per the Phase 9 scope:
- Cloud Sync, Accounts, Friends, Achievements, Plugins, Auto Updates
- Packaging / installer
- The "Discover" tab (button visible but disabled with tooltip)
