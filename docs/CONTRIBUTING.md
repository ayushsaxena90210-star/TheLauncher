# Development Workflow

## Phase discipline

Work on one approved phase at a time. Before implementation, describe its purpose, architecture fit, expected folder/API/database changes, and risks. Do not begin the next phase automatically.

## Completion checklist

At the end of each phase:

1. Run the relevant build, typecheck, and tests.
2. Manually verify the user-facing flow.
3. Update `README.md` and all affected architecture/API/database documents.
4. Add `docs/PhaseX.md` with implementation details and handoff instructions.
5. Add a journal entry and suggested commit message.

## Quality rules

- Prefer small, typed modules and explicit boundaries.
- Keep business rules in FastAPI.
- Keep Electron's preload bridge narrow and validated.
- Avoid feature expansion beyond the roadmap without an explicit documented decision.
