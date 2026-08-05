"""Abstract base class for metadata providers.

MetadataService programs against this interface.  Adding a new provider
(Steam, GOG, RAWG, etc.) requires only implementing this class — no
changes to MetadataService.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class MetadataResult:
    """A single metadata search result from a provider."""

    provider_name: str
    external_id: int
    title: str
    summary: str | None = None
    release_date: str | None = None  # ISO date string YYYY-MM-DD
    genres: list[str] = field(default_factory=list)
    developers: list[str] = field(default_factory=list)
    publishers: list[str] = field(default_factory=list)
    platforms: list[str] = field(default_factory=list)
    rating: float | None = None
    age_rating: str | None = None
    themes: list[str] = field(default_factory=list)
    franchises: list[str] = field(default_factory=list)
    game_modes: list[str] = field(default_factory=list)
    official_website: str | None = None
    cover_image_id: str | None = None  # Provider-specific image identifier


class MetadataProvider(ABC):
    """Interface that every metadata provider must implement."""

    @abstractmethod
    async def search(self, title: str) -> list[MetadataResult]:
        """Search the provider for games matching *title*.

        Returns up to 10 results ordered by relevance.  Should never raise
        exceptions that escape MetadataService — wrap provider-specific
        errors in ``ProviderError``.
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return a stable short name like ``'igdb'`` or ``'steam'``."""
