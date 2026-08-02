# Phase 3 — Game Library

## Completed work

- Added the Library page with a responsive game grid, future-cover placeholders, and client-side title search.
- Added manual add, edit, and delete flows using one shared add/edit dialog and a deletion confirmation dialog.
- Added reusable loading, empty, error, and game-card/grid components.
- Added a typed renderer API client, games service, and focused list/create/update/delete hooks. Components do not call `fetch`.
- Added an application error boundary for unexpected renderer failures.
- Added narrowly restricted CORS support for the Vite development origins only: `localhost:5173` and `127.0.0.1:5173`.

## Files added

- `src/renderer/src/services/client.ts`
- `src/renderer/src/services/gameService.ts`
- `src/renderer/src/types/game.ts`
- `src/renderer/src/hooks/useGames.ts`
- `src/renderer/src/hooks/useCreateGame.ts`
- `src/renderer/src/hooks/useUpdateGame.ts`
- `src/renderer/src/hooks/useDeleteGame.ts`
- `src/renderer/src/pages/LibraryPage.tsx`
- `src/renderer/src/components/ErrorBoundary.tsx`
- `src/renderer/src/components/library/`

## Architecture changes

The renderer accesses the existing local games API through `client.ts`, then `gameService.ts`, then hooks. FastAPI remains the owner of persistence and business rules; the SQLite schema and game service logic were not changed.

## Testing performed

- `npm run build`
- `python -m pytest backend/tests -q`
- Live local FastAPI CRUD verification for create, list, update, delete, and development CORS preflight.

## Known issues and future improvements

- Production renderer-to-local-API transport should be verified during packaging; Phase 3 only permits Vite development origins for CORS as required.
- Cover artwork, executable launch, scanning, metadata, sessions/playtime, statistics, settings, and favourites remain intentionally out of scope.
