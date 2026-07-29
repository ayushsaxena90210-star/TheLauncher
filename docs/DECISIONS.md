# Architecture Decisions

## ADR-001: Use a local FastAPI backend

**Decision:** Keep library business logic, persistence, scanning, metadata, and statistics in FastAPI rather than React or Electron.

**Reason:** This preserves a clean UI boundary, keeps Python filesystem/data work testable, and follows the requested architecture.

## ADR-002: Electron is a thin native-integration layer

**Decision:** Electron will not access or mutate the database.

**Reason:** It avoids duplicated business rules and limits desktop privileges to the operations that require them.

## ADR-003: Hydra is reference, not a dependency

**Decision:** Reuse design lessons from Hydra's renderer/main/preload separation but do not transplant its code or product scope.

**Reason:** The desired app is deliberately smaller, offline-first, and excludes downloading/torrent/social/cloud functionality.

## ADR-004: SQLite is authoritative

**Decision:** SQLite is the one persistent application datastore; artwork is a managed file cache referenced from it.

**Reason:** It makes backup, cleanup, testing, and future migration straightforward.

## ADR-005: Tailwind is the planned styling system

**Decision:** Use Tailwind for the new project's UI despite Hydra using SCSS.

**Reason:** Tailwind is explicitly requested for Phase 1. The visual inspiration is independent of the styling implementation.
