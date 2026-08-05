"""Safe local cache management for downloaded metadata artwork."""

from __future__ import annotations

from pathlib import Path


class CacheManager:
    """Owns the cover-art cache directory without exposing it to clients."""

    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir.resolve()

    def ensure_directory(self) -> Path:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        return self.cache_dir

    def cover_path(self, game_id: str) -> Path:
        """Return the canonical JPEG cache path for a game identifier."""
        path = (self.ensure_directory() / f"{game_id}.jpg").resolve()
        if not path.is_relative_to(self.cache_dir):
            raise ValueError("Cover cache path escaped the configured cache directory.")
        return path

    def contains(self, path: Path) -> bool:
        try:
            path.resolve().relative_to(self.cache_dir)
            return True
        except ValueError:
            return False

    def files(self) -> list[Path]:
        """Return regular files inside the cache, never following directory links."""
        if not self.cache_dir.exists():
            return []
        return [path for path in self.cache_dir.rglob("*") if path.is_file() and self.contains(path)]

    def statistics(self) -> tuple[int, int]:
        files = self.files()
        return sum(path.stat().st_size for path in files), len(files)

    def remove_files(self, files: list[Path]) -> tuple[int, int]:
        removed_count = 0
        removed_bytes = 0
        for path in files:
            if not self.contains(path) or not path.is_file():
                continue
            size = path.stat().st_size
            path.unlink()
            removed_count += 1
            removed_bytes += size
        return removed_count, removed_bytes
