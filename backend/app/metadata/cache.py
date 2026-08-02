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
