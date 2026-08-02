"""Metadata-specific exception types.

These exceptions are caught by MetadataService and never propagate to
the scanner, game management, or launch systems.
"""


class MetadataError(Exception):
    """Base exception for all metadata-related failures."""


class OAuthError(MetadataError):
    """Twitch OAuth token acquisition or refresh failure."""


class ProviderError(MetadataError):
    """Remote metadata provider returned an error or unexpected response."""


class DownloadError(MetadataError):
    """Cover artwork download failure."""
