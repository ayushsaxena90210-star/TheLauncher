# Phase 7 — Game Details & Library Experience

## Goal

Phase 7 turns a library card into a dedicated local game page while preserving the offline-first boundaries: React presents the experience, Electron provides desktop operations, and FastAPI owns data, sessions, and local artwork access.

## User experience

- Selecting a game cover or title opens `#/game/:gameId`; the URL supports direct navigation.
- The hero uses cached cover art as a subdued backdrop, with the cover, title, playtime summary, and Play action in the foreground.
- The main column contains About, Media, and Activity. The sidebar contains Details and Technical information.
- Actions provide Play, metadata refresh, open file location, edit, copy executable path, official website (when supplied), and remove from library.
- Loading, missing-game, and missing-metadata states are explicit rather than leaving blank panels.

## Data flow

```text
Game card click → Hash route → useGameDetails
  ├─ GET /games/{id}                         game and persisted metadata
  ├─ GET /sessions/games/{id}/activity       totals and recent sessions
  └─ GET /metadata/games/{id}/screenshots    locally cached screenshot indexes
```

`game:exited` refreshes activity so a completed session is reflected without leaving the page. Media remains behind FastAPI endpoints; the renderer never receives artwork paths. The selected screenshot loads first and thumbnails use browser lazy loading.

## Metadata enrichment

The existing IGDB provider is still the sole provider. It now requests summary, release date, genres, developer/publisher roles, platforms, total rating, age-rating value, themes, franchises, game modes, and an official website. `MetadataService` persists returned values through the existing background/refresh flow.

Existing games require a manual metadata refresh. IGDB coverage varies by title, so a missing value means either it has not yet been refreshed or the matched IGDB entry does not provide it.

## Backend and database

- `GET /api/v1/sessions/games/{id}/activity` returns total playtime, last played, launch count, and a bounded session history.
- Screenshot listing/streaming endpoints return cached media by index and preserve renderer filesystem isolation.
- Alembic revision `20260804_01_add_game_details_metadata` adds only nullable detail fields to `games`; no new tables were required.
- Automatic screenshot downloading is intentionally still a follow-up; the Media UI has a focused empty state until screenshots are locally cached.

## Files added

- `src/renderer/src/pages/GameDetailsPage.tsx`
- `src/renderer/src/hooks/useGameDetails.ts`
- `backend/alembic/versions/20260804_01_add_game_details_metadata.py`

## Verification

- `npm run build` passed, including TypeScript checking.
- `python -m pytest backend/tests -q` passed: 23 tests.
- `git diff --check` passed.

## Known limitations

- Metadata requires configured Twitch/IGDB credentials and depends on the completeness of the matched record.
- Existing games need **Refresh Metadata** for the newer fields.
- Trailer support, automatic screenshot retrieval, statistics dashboards, settings, packaging, cloud sync, achievements, friends, and online services are outside this phase.
