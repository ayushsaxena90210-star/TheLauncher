We are continuing development of the Game Launcher project.
This is Phase 2: Persistence Foundation.
Before writing ANY code:
Read all the docs in /docs
Read docs/handoff.md
Review the current project structure.
Verify the project builds successfully.
Summarize your understanding of the architecture.
Identify any technical debt or improvements that should be addressed BEFORE Phase 2.
Do not modify any files yet.
Wait for my approval after presenting your findings and implementation plan.




Show more

3:30 PM






Worked for 1m 25s



Review complete. No files were modified.
The Phase 1 foundation is healthy:
npm run build passed (including TypeScript typechecking).
Backend health test passed: 1 test passed.
Working tree remains clean.
Pytest emitted non-blocking cache-permission warnings from pre-existing cache directories.
Architecture understanding:
React is a presentation-only renderer, currently showing a static foundation screen.
Electron provides the secure desktop boundary: window lifecycle, narrowly scoped preload IPC, and FastAPI child-process management.
FastAPI is the intended application layer for persistence, validation, and future library logic.
SQLite will be authoritative; Electron and React must not access it directly.
The existing renderer → preload → Electron IPC health check validates the intended process boundary.
Current structure is appropriately minimal: src/main, src/preload, src/renderer, and backend/app are present; database/ contains only .gitkeep, as expected.
Items to address before or within Phase 2:
Add a proper configuration layer for database paths and environment overrides; the current Settings model is intentionally too small for persistence.
Establish SQLAlchemy session lifecycle/dependency injection so route handlers never manage raw connections.
Add centralized API error handling to fulfill the documented stable error shape.
Define and test executable-path normalization before creating the uniqueness constraint.
Add backend test isolation using a temporary SQLite database; avoid writing test state to database/.
Clean up or ignore the inaccessible pytest-cache-files-* directories to remove pytest cache warnings.
No blocking architecture flaw requires a separate pre-Phase-2 refactor.
Proposed Phase 2 implementation plan:
Add SQLAlchemy 2.x, Alembic, and the minimal configuration dependencies.
Create backend layers for database engine/session, ORM models, Pydantic schemas, repositories, and application services.
Establish Alembic and generate the first migration.
Implement the initial games table only: UUID ID, title, normalized executable path (unique), optional install/metadata fields, and timestamps. Defer sessions, scanning, metadata cache, and settings tables to their owning phases.
Add a backend-only CRUD contract under /api/v1/games:create, list, retrieve, update, delete
typed request/response schemas
stable validation/not-found/conflict errors

Add focused API, repository, migration, and persistence tests using temporary SQLite databases.
Keep Electron/React unchanged unless a strictly necessary typed contract is needed—no library UI until Phase 3.
Complete Phase 2 documentation: README, API/database/architecture updates, docs/Phase2.md, journal entry, and handoff.
Please approve this scope and plan, and I’ll begin implementation.


3:32 PM







Now create a detailed implementation plan for Phase 2.
Include:
Goals
Folder changes
Files to create
Files to modify
Database schema
SQLAlchemy models
Alembic migration plan
FastAPI router structure
CRUD architecture
Pydantic schemas
Testing strategy
Documentation updates
Risks
Estimated implementation order
Do not write code yet.




Show more

3:32 PM






Phase 2 Implementation Plan — Persistence Foundation
No code will be written until you approve this plan.
Goals
Phase 2 establishes a durable, testable backend persistence layer without building the game-library interface.
Add SQLite as the authoritative local datastore.
Add SQLAlchemy 2.x ORM models and a managed session lifecycle.
Add Alembic migrations for versioned schema changes.
Implement a small backend-only CRUD slice for games.
Establish typed API contracts, stable error responses, and test isolation.
Keep React and Electron unchanged unless strictly required by the backend contract.
Phase 3 will consume the game API to build manual library management UI.
Folder changes
backend/
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 0001_create_games_table.py
├── app/
│   ├── api/
│   │   ├── dependencies.py
│   │   └── v1/
│   │       ├── router.py
│   │       └── games.py
│   ├── database/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   └── game.py
│   ├── repositories/
│   │   └── game_repository.py
│   ├── schemas/
│   │   ├── common.py
│   │   └── game.py
│   ├── services/
│   │   └── game_service.py
│   ├── config.py
│   ├── errors.py
│   └── main.py
├── tests/
│   ├── conftest.py
│   ├── api/
│   │   └── test_games.py
│   ├── database/
│   │   └── test_migrations.py
│   ├── repositories/
│   │   └── test_game_repository.py
│   └── test_health.py
├── alembic.ini
└── requirements.txt
The existing frontend and Electron folders will remain unchanged in this phase.
Files to create
backend/alembic.ini — Alembic configuration.
backend/alembic/env.py — migration environment, configured with the application database URL and ORM metadata.
backend/alembic/versions/0001_create_games_table.py — initial versioned schema migration.
backend/app/database/base.py — declarative SQLAlchemy base and model metadata registration.
backend/app/database/session.py — engine, session factory, and FastAPI session dependency.
backend/app/models/game.py — Game SQLAlchemy model.
backend/app/api/dependencies.py — shared API dependencies, primarily database sessions.
backend/app/api/v1/router.py — versioned router aggregation.
backend/app/api/v1/games.py — thin HTTP route handlers for game CRUD.
backend/app/repositories/game_repository.py — database queries and mutations.
backend/app/services/game_service.py — validation, normalization, conflict/not-found handling, and use-case orchestration.
backend/app/schemas/common.py — reusable API error-detail schema.
backend/app/schemas/game.py — create, update, list, and response models.
backend/app/errors.py — domain exceptions and handlers.
backend/tests/conftest.py — isolated database setup and dependency overrides.
CRUD, repository, and migration test modules listed above.
Files to modify
backend/requirements.txt
Add SQLAlchemy 2.x.
Add Alembic.
Add the configuration dependency if selected (pydantic-settings).
Pin compatible versions where appropriate.

backend/app/config.py
Expand settings with development database location, packaged-app override support, and database URL construction.
Preserve the existing API prefix configuration.

backend/app/main.py
Register the /api/v1 router.
Register stable domain-error handlers.
Keep /health unchanged.

backend/app/__init__.py
Only if needed for explicit package exports.

backend/tests/test_health.py
Keep the health assertion, adapting only if application setup is reorganized.

.gitignore
Confirm development SQLite, Alembic artifacts, and test-generated data remain ignored. No production database should be committed.

Documentation files listed below.

Database schema
Phase 2 creates only the games table. The proposed game_sessions, scanner, metadata-cache, and settings tables remain deferred to their owning phases to avoid premature schema commitments.
Column	Type	Constraints	Purpose
id	UUID stored as string	Primary key, generated by the backend	Stable game identifier
title	text	Required, non-empty	Display name
executable_path	text	Required	Original absolute executable path
executable_path_normalized	text	Required, unique	Canonical comparison key for path uniqueness
install_path	text	Nullable	Optional install directory
cover_path	text	Nullable	Reserved for Phase 6 local artwork cache
description	text	Nullable	Reserved metadata field
release_date	date	Nullable	Reserved metadata field
created_at	timezone-aware timestamp	Required	Creation audit timestamp
updated_at	timezone-aware timestamp	Required	Last-change audit timestamp

Indexes/constraints:
Primary key on id.
Unique constraint/index on executable_path_normalized.
Optional index on title may be included only if it has clear Phase 3 search value; otherwise defer until search behavior is specified.
No foreign keys in this migration.
Path normalization will be centralized in the service layer. It will compare paths according to the supported host operating-system rules while preserving the user-provided path for display and launching later.
SQLAlchemy model design
Game will be the sole Phase 2 domain model.
Uses the shared declarative Base.
Maps directly to the games table.
Generates UUID identifiers in Python, avoiding SQLite-specific ID behavior.
Uses UTC timestamps generated consistently in the backend.
Keeps persistence concerns limited to mapping and constraints.
Contains no HTTP parsing, Electron behavior, scanning logic, metadata fetching, or launch policy.
The database module will own:
SQLAlchemy engine creation.
Session factory configuration.
A per-request FastAPI session dependency.
SQLite connection options appropriate for local development and tests.
Alembic migration plan
Initialize Alembic under backend/alembic.
Configure the migration environment to import SQLAlchemy metadata and read the configured database URL.
Create revision 0001_create_games_table.
In upgrade():Create games.
Add the normalized executable-path uniqueness constraint/index.
Add required audit fields.

In downgrade():Drop games cleanly.

Verify migrations by upgrading a brand-new temporary SQLite database during tests.
At normal application startup, the backend will not create tables implicitly. Schema changes occur through Alembic migrations only.
FastAPI router structure
/api/v1
└── /games
    ├── POST   /games
    ├── GET    /games
    ├── GET    /games/{game_id}
    ├── PATCH  /games/{game_id}
    └── DELETE /games/{game_id}
/health remains unversioned because Electron depends on it as a process-readiness endpoint.
Routes will be intentionally thin:
Parse and validate Pydantic input.
Obtain a database session through the dependency.
Call the game service.
Return typed responses.
Let domain error handlers produce the documented error format.
CRUD architecture
FastAPI route
    ↓
Game service
    ↓
Game repository
    ↓
SQLAlchemy session / SQLite
Responsibilities:
Route: HTTP concerns only.
Service: use cases, path normalization, conflict handling, and domain rules.
Repository: query and persistence operations only.
Model: database mapping only.
Schema: public API contract only.
CRUD behavior:
Create rejects duplicate normalized executable paths.
List returns a predictable order, initially most recently updated first.
Retrieve returns a typed not-found error for an unknown UUID.
Update supports partial updates and recalculates the normalized path when the executable changes.
Delete removes only the database record; it never deletes executables, install folders, or cached assets.
Pydantic schemas
GameCreate
title
executable_path
optional install_path
optional reserved metadata fields only if appropriate for the initial contract
GameUpdate
All editable fields optional.
Requires at least one field after validation.
GameResponse
id
all persisted game fields
ISO-8601 timestamps
GameListResponse
items: list[GameResponse]
A simple, stable list envelope that can accommodate pagination later without breaking consumers.
ErrorDetail and ErrorResponse
{
  "detail": {
    "code": "game_not_found",
    "message": "No game exists for the supplied identifier."
  }
}
Expected domain error codes:
validation_error
game_not_found
duplicate_executable_path
internal_error
FastAPI’s default validation output will be adapted to the documented stable error envelope where practical.
Testing strategy
Backend tests will use temporary SQLite databases and must never depend on database/ or a developer’s existing data.
Health regression test: preserve the existing /health test.
Migration test:Upgrade an empty temporary database.
Confirm games and required indexes/constraints exist.

Repository tests:Create and retrieve a game.
Update fields.
Delete a game.
Verify normalized-path uniqueness behavior.

API tests:Valid create/read/list/update/delete flow.
Invalid UUID behavior.
Missing game returns the stable 404 error envelope.
Duplicate executable path returns the stable conflict response.
Invalid/empty title and invalid path input are rejected.

Test isolation:Each test gets a fresh temporary database or transaction-scoped cleanup.
FastAPI’s production session dependency is overridden in tests.

Verification at completion:
npm run typecheck
npm run build
backend test suite
Alembic upgrade verification against a fresh SQLite file
Documentation updates
README.md
Mark Phase 2 complete.
Document the SQLite persistence layer, migration workflow, and current game API.
Update development commands for migration use.

docs/API.md
Mark /api/v1/games endpoints as implemented.
Document request/response and error contracts.

docs/DATABASE.md
Mark the games table as implemented.
Record its actual types, constraints, normalized-path policy, and migration revision.

docs/ARCHITECTURE.md
Add repository/service/database-session boundaries.

docs/DECISIONS.md
Add an ADR for SQLAlchemy/Alembic and the normalized executable-path uniqueness policy if those become material decisions.

docs/PROJECT_JOURNAL.md
Record Phase 2 decisions and verification results.

docs/Phase2.md
Full phase handoff: implementation details, files, API, migration, tests, known limitations, and explicit Phase 3 starting point.

handoff.md
Replace the Phase 1 handoff with Phase 2 continuation guidance.

Risks
SQLite path handling differs by platform. Centralized normalization and tests will reduce inconsistent uniqueness behavior.
SQLite migration behavior is more limited than server databases for some schema alterations; the first migration is simple, and later migrations must use Alembic’s SQLite-safe patterns.
Strictly verifying that a supplied executable exists could make manual library management inconvenient. Phase 2 should validate safe/absolute paths but defer launchability checks to Phase 3/4 behavior.
Timestamp timezone handling must be consistent because SQLite does not enforce timezone-aware values natively.
The current Pytest cache warning is environmental rather than an application failure; test setup should avoid depending on cache writes.
Estimated implementation order
Confirm exact Phase 2 API field scope and path-normalization policy.
Add dependencies and expand backend configuration.
Create SQLAlchemy base, engine, session dependency, and model.
Initialize Alembic and create/test the initial migration.
Add Pydantic schemas and standard error contract.
Implement repository and service layers.
Add versioned FastAPI router and register it in the app.
Add isolated repository, API, and migration tests.
Run backend tests, TypeScript typecheck, and production build.
Update all required documentation and prepare Phase 2 handoff.
Approval of this plan authorizes implementation of Phase 2 only; no Phase 3 interface work would be included.