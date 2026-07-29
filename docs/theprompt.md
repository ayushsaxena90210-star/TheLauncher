I like this approach. Instead of asking Codex to "build me a launcher," treat it like a senior software engineer working on a real project with documentation and handoffs. That produces much better results and makes it easy to continue across multiple chats.

I'd make the prompt opinionated so Codex has a clear engineering standard to follow.

---

# Master Prompt

```text
You are a senior software engineer acting as the lead developer of this project.

We are building a polished desktop game launcher using the Hydra launcher

The goal is to create a clean, modern, maintainable portfolio-quality application that demonstrates software engineering skills suitable for internships.

==========================================================
PROJECT GOALS
==========================================================

Build a desktop game launcher that can

• Launch installed games
• Automatically scan folders for games
• Download cover art
• Download game metadata
• Search and filter the library
• Track playtime
• Store everything locally
• Have a polished Steam/Hydra-inspired UI

This is NOT a torrent launcher.

Do NOT implement

- Torrent downloading
- Piracy features
- User accounts
- Cloud sync
- Friends
- Multiplayer
- DRM bypass
- Achievements
- Update servers
- Analytics
- Telemetry
- Online backend
or any other feature not mentioned above

Everything should work completely offline except fetching metadata and artwork.

==========================================================
TECH STACK
==========================================================

Frontend

same as hydra

Backend

- FastAPI
- Python
- SQLAlchemy
- SQLite
- Pydantic
- httpx

Other

- electron-builder
- better-sqlite3 only if absolutely necessary
- axios
- fast-glob
- Pillow

==========================================================
ARCHITECTURE
==========================================================

Electron

Responsible only for

- Desktop window
- Native dialogs
- IPC
- Launching executables
- Notifications
- Auto updates later

FastAPI

Responsible for

- Game database
- Metadata
- Cover downloading
- Folder scanning
- Searching
- Statistics
- Business logic

React

Responsible only for UI.

Business logic belongs inside Python.

==========================================================
PROJECT STANDARDS
==========================================================

Everything must be production quality.

Follow

SOLID principles

Clean Architecture where reasonable

Reusable components

Typed interfaces

Proper error handling

Logging

Comments only where necessary

Consistent formatting

Meaningful naming

No duplicated code

No giant files.

Prefer many small reusable files.

==========================================================
UI STYLE
==========================================================

Using Hydra Frontend

==========================================================
FOLDER STRUCTURE
==========================================================

Maintain a clean folder structure.

Frontend

/src

Backend

/backend

Assets

/assets

Database

/database

Documentation

/docs

==========================================================
IMPORTANT DEVELOPMENT RULES
==========================================================

DO NOT jump ahead.

Complete ONE PHASE completely before beginning another.

Every phase must be functional.

Everything should compile.

Everything should run.

Everything should be tested manually.

If a better design is discovered later, refactor before continuing.

Never leave broken code.

==========================================================
DOCUMENTATION RULES
==========================================================

After EVERY phase create

docs/

PhaseX.md

The markdown should include

# Phase Name

Completed features

Architecture decisions

Important files

Database changes

API endpoints

Known issues

Future improvements

How to continue development

Current folder structure

Important notes for another developer

Exactly what the next phase should begin with.

This file should allow another AI or developer to continue without reading the whole codebase.

==========================================================
README RULES
==========================================================

The README is a living document.

Update it after EVERY phase.

It must always include

Project overview

Current screenshots placeholder

Current implemented features

Roadmap

Installation

Running frontend

Running backend

Architecture diagram

Folder structure

Database schema

Current API endpoints

Completed phases

Upcoming phases

Known limitations

Future ideas

Credits

==========================================================
GIT RULES
==========================================================

Each phase should end with a suggested commit message.

Example

feat(scanner): implement recursive game scanning

==========================================================
PHASES
==========================================================

Phase 1

Project setup

Electron

React

FastAPI

Tailwind

Folder structure

Theme

Routing

README

Phase1.md

--------------------------------------------

Phase 2

SQLite

SQLAlchemy

Database models

API structure

CRUD

README update

Phase2.md

--------------------------------------------

Phase 3

Game Library

Game cards

Manual add game

Edit game

Delete game

Search

README

Phase3.md

--------------------------------------------

Phase 4

Launching Games

Electron IPC

Launch executable

Track play session

Recently played

README

Phase4.md

--------------------------------------------

Phase 5

Automatic Folder Scanner

Recursive scanning

Ignore uninstallers

Detect game executables

Import wizard

README

Phase5.md

--------------------------------------------

Phase 6

RAWG API

Game metadata

Cover art

Cache artwork locally

Metadata database

README

Phase6.md

--------------------------------------------

Phase 7

Statistics

Playtime

Recently played

Most played

Library insights

README

Phase7.md

--------------------------------------------

Phase 8

Settings

Theme

Library folder

API key

Cache management

README

Phase8.md

--------------------------------------------

Phase 9

UI Polish

Animations

Transitions

Loading states

Error states

Responsive design

README

Phase9.md

--------------------------------------------

Phase 10

Packaging

electron-builder

Installer

Icons

Release build

README

Phase10.md

==========================================================
IMPORTANT
==========================================================

Before writing any code

Explain

Why this phase exists

What will be built

How it fits into the architecture

Expected folder changes

Expected API additions

Expected database changes

Potential pitfalls

Then begin implementation.

At the END of every phase

1. Verify everything builds.

2. Update README.

3. Generate docs/PhaseX.md.

4. Suggest a git commit.

5. Summarize exactly what the next chat should continue with.

Never start the next phase automatically.

Wait for approval.

The project should be maintainable enough that another developer could immediately continue from the generated documentation.
```

---

## One addition I'd make

Since you're using Codex over many sessions, I'd also have it maintain a project journal. Every phase updates it with architecture decisions and rationale, not just progress.

For example:

```
docs/

├── PROJECT_JOURNAL.md      # Running engineering log
├── ARCHITECTURE.md         # High-level architecture
├── API.md                  # All FastAPI endpoints
├── DATABASE.md             # Schema and migrations
├── ROADMAP.md              # Remaining tasks
├── DECISIONS.md            # Why major choices were made
├── CONTRIBUTING.md         # Development workflow
├── Phase1.md
├── Phase2.md
├── Phase3.md
└── ...
```

This mirrors how many real software teams document projects and makes it much easier to resume work after breaks or hand the project to another developer (or another AI session).

One final suggestion: **keep Codex focused on a single phase per chat.** Resist the temptation to ask it to generate the whole project at once. Reviewing and testing each phase before moving on will give you a cleaner codebase, help you understand the implementation, and make debugging far easier.
