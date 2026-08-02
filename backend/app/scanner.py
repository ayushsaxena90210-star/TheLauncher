"""Transient folder-scanning jobs for the local launcher backend."""

from __future__ import annotations

import os
from uuid import UUID
import stat
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .models import Game
from .repositories import GameRepository
from .metadata.title_normalizer import derive_display_name


class ExecutableDetector:
    """Keeps executable identification and exclusion heuristics in one place."""

    _excluded_terms = (
        "unins",
        "uninstall",
        "updater",
        "update",
        "launcher",
        "setup",
        "installer",
        "redistributable",
        "redist",
        "crashreport",
        "crash_report",
        "reporting",
        "dxsetup",
        "vcredist",
        "sfv",
        "quicksfv",
        "lang",
        "language",
        "selector",
        "config",
        "configuration",
        "settings",
        "benchmark",
        "anticheat",
        "easyanticheat",
        "battleye",
        "unitycrashhandler",
        "patch",
        "patcher",
        "register",
        "activation",
        "helper",
    )

    def is_executable(self, path: Path) -> bool:
        return path.suffix.casefold() == ".exe"

    def exclusion_reason(self, path: Path) -> str | None:
        stem = path.stem.casefold()
        if any(term in stem for term in self._excluded_terms):
            return "Excluded by executable-name rule."
        return None


@dataclass
class ScanCandidate:
    id: str
    display_name: str
    executable_path: str
    root_folder: str
    already_imported: bool
    reason_skipped: str | None = None
    file_size: int | None = None
    modified_at: datetime | None = None


@dataclass
class ScanSummary:
    folders_scanned: int = 0
    directories_visited: int = 0
    executables_checked: int = 0
    games_detected: int = 0
    already_imported_games: int = 0
    excluded_items: int = 0
    permission_warnings: int = 0
    successfully_imported_games: int = 0


@dataclass
class ScanJob:
    id: str
    roots: list[Path]
    state: str = "scanning"
    current_path: str | None = None
    summary: ScanSummary = field(default_factory=ScanSummary)
    candidates: list[ScanCandidate] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    error: str | None = None
    cancel_requested: bool = False


class ScannerService:
    """Runs cancellable scans in memory; persistence happens only on import."""

    _ignored_directory_names = {
        "$recycle.bin",
        "system volume information",
        "windows",
        "node_modules",
        ".git",
        "__pycache__",
        ".cache",
        "engine",
        "plugins",
        "redist",
        "_commonredist",
        "support",
        "dependencies",
        "directx",
        "dotnet",
    }

    def __init__(self, detector: ExecutableDetector | None = None) -> None:
        self._detector = detector or ExecutableDetector()
        self._jobs: dict[str, ScanJob] = {}
        self._lock = threading.RLock()

    def start(self, roots: list[str], session: Session) -> ScanJob:
        normalized_roots = [Path(root).resolve(strict=False) for root in roots]
        invalid_roots = [str(root) for root in normalized_roots if not root.is_dir()]
        if invalid_roots:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "invalid_scan_root", "message": f"Not a readable folder: {invalid_roots[0]}"},
            )
        job = ScanJob(id=str(uuid4()), roots=normalized_roots)
        with self._lock:
            self._jobs[job.id] = job
        existing_paths = {self._normalize_path(game.executable_path) for game in GameRepository().list(session)}
        threading.Thread(target=self._scan, args=(job.id, existing_paths), daemon=True).start()
        return job

    def get(self, scan_id: str) -> ScanJob:
        with self._lock:
            job = self._jobs.get(scan_id)
            if job is None:
                raise HTTPException(status_code=404, detail={"code": "scan_not_found", "message": "Scan was not found."})
            return job

    def cancel(self, scan_id: str) -> ScanJob:
        with self._lock:
            job = self.get(scan_id)
            if job.state == "scanning":
                job.cancel_requested = True
            return job

    def import_candidates(self, scan_id: str, candidate_ids: list[str], session: Session) -> tuple[int, int, list[UUID], ScanJob]:
        with self._lock:
            job = self.get(scan_id)
            if job.state != "completed":
                raise HTTPException(status_code=409, detail={"code": "scan_not_completed", "message": "Wait for the scan to complete before importing."})
            candidates_by_id = {candidate.id: candidate for candidate in job.candidates}
            unknown_ids = set(candidate_ids) - candidates_by_id.keys()
            if unknown_ids:
                raise HTTPException(status_code=400, detail={"code": "invalid_scan_candidate", "message": "A selected candidate does not belong to this scan."})
            selected = [candidates_by_id[candidate_id] for candidate_id in dict.fromkeys(candidate_ids)]

        existing_paths = {self._normalize_path(game.executable_path) for game in GameRepository().list(session)}
        importable: list[ScanCandidate] = []
        skipped = 0
        for candidate in selected:
            candidate_path = Path(candidate.executable_path)
            if candidate.already_imported or candidate.reason_skipped or not candidate_path.is_file() or self._normalize_path(candidate.executable_path) in existing_paths:
                skipped += 1
            else:
                importable.append(candidate)

        imported_ids: list[UUID] = []
        try:
            for candidate in importable:
                game = Game(
                    title=candidate.display_name,
                    executable_path=self._normalize_path(candidate.executable_path),
                    install_path=self._compute_install_path(candidate.executable_path, candidate.root_folder),
                )
                session.add(game)
                session.flush()
                imported_ids.append(game.id)
            session.commit()
        except Exception as error:
            session.rollback()
            raise HTTPException(status_code=409, detail={"code": "scanner_import_failed", "message": "No games were imported because the batch could not be saved."}) from error

        with self._lock:
            job.summary.successfully_imported_games += len(importable)
        return len(importable), skipped, imported_ids, job

    def snapshot(self, scan_id: str) -> dict:
        with self._lock:
            job = self.get(scan_id)
            return {
                "scan_id": job.id,
                "state": job.state,
                "current_path": job.current_path,
                "summary": job.summary.__dict__.copy(),
                "candidates": [candidate.__dict__.copy() for candidate in job.candidates],
                "warnings": job.warnings.copy(),
                "error": job.error,
            }

    def _scan(self, scan_id: str, existing_paths: set[str]) -> None:
        job = self.get(scan_id)
        try:
            for root in job.roots:
                with self._lock:
                    if job.cancel_requested:
                        job.state = "cancelled"
                        return
                    job.summary.folders_scanned += 1
                self._walk_root(job, root, existing_paths)
                with self._lock:
                    if job.cancel_requested:
                        job.state = "cancelled"
                        return
            with self._lock:
                job.current_path = None
                job.state = "completed"
        except Exception as error:  # Keep filesystem failures isolated to this job.
            with self._lock:
                job.state = "failed"
                job.error = f"Scanning failed: {error}"

    def _walk_root(self, job: ScanJob, root: Path, existing_paths: set[str]) -> None:
        directories = [root]
        while directories:
            with self._lock:
                if job.cancel_requested:
                    return
            directory = directories.pop()
            with self._lock:
                job.current_path = str(directory)
                job.summary.directories_visited += 1
            try:
                with os.scandir(directory) as entries:
                    for entry in entries:
                        with self._lock:
                            if job.cancel_requested:
                                return
                        try:
                            path = Path(entry.path)
                            if entry.is_symlink():
                                continue
                            if entry.is_dir(follow_symlinks=False):
                                if not self._ignore_directory(path):
                                    directories.append(path)
                            elif entry.is_file(follow_symlinks=False) and self._detector.is_executable(path):
                                self._inspect_executable(job, path, root, existing_paths)
                        except OSError as error:
                            self._warning(job, f"Could not inspect {entry.path}: {error.strerror or error}")
            except OSError as error:
                self._warning(job, f"Could not read {directory}: {error.strerror or error}")

    def _inspect_executable(self, job: ScanJob, path: Path, root: Path, existing_paths: set[str]) -> None:
        normalized_path = self._normalize_path(str(path))
        with self._lock:
            job.current_path = str(path)
            job.summary.executables_checked += 1
            if any(candidate.executable_path.casefold() == normalized_path.casefold() for candidate in job.candidates):
                job.summary.excluded_items += 1
                return
        exclusion_reason = self._detector.exclusion_reason(path)
        if exclusion_reason:
            with self._lock:
                job.summary.excluded_items += 1
            return
        try:
            file_stat = path.stat()
            modified_at = datetime.fromtimestamp(file_stat.st_mtime, timezone.utc)
            file_size = file_stat.st_size
        except OSError:
            modified_at = None
            file_size = None
        already_imported = normalized_path in existing_paths
        install_folder = self._compute_install_path(str(path), str(root))
        candidate = ScanCandidate(
            id=str(uuid4()),
            display_name=derive_display_name(str(path), install_folder),
            executable_path=normalized_path,
            root_folder=str(root),
            already_imported=already_imported,
            reason_skipped="Already in your library." if already_imported else None,
            file_size=file_size,
            modified_at=modified_at,
        )
        with self._lock:
            job.candidates.append(candidate)
            job.summary.games_detected += 1
            if already_imported:
                job.summary.already_imported_games += 1

    def _ignore_directory(self, path: Path) -> bool:
        if path.name.casefold() in self._ignored_directory_names or path.name.startswith("."):
            return True
        try:
            attributes = path.stat().st_file_attributes
            return bool(attributes & (stat.FILE_ATTRIBUTE_HIDDEN | stat.FILE_ATTRIBUTE_SYSTEM))
        except (AttributeError, OSError):
            return False

    def _warning(self, job: ScanJob, message: str) -> None:
        with self._lock:
            job.summary.permission_warnings += 1
            if len(job.warnings) < 100:
                job.warnings.append(message)

    @staticmethod
    def _normalize_path(value: str) -> str:
        return str(Path(value).resolve(strict=False))

    @staticmethod
    def _compute_install_path(executable_path: str, root_folder: str) -> str:
        exe_p = Path(executable_path)
        root_p = Path(root_folder)
        try:
            rel = exe_p.relative_to(root_p)
            parts = rel.parts
            if len(parts) <= 1:
                return str(root_p)
            first_sub = root_p / parts[0]
            if first_sub.is_dir():
                return str(first_sub)
            return str(root_p)
        except ValueError:
            return str(exe_p.parent)

