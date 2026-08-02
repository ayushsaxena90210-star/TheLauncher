"""Twitch App Access Token lifecycle manager.

Handles token acquisition, in-memory caching, expiry checking, and
automatic re-acquisition.  Used exclusively by IGDBProvider — MetadataService
never interacts with this class directly.

Credentials are read from environment variables:
  TWITCH_CLIENT_ID
  TWITCH_CLIENT_SECRET
"""

from __future__ import annotations

import asyncio
import logging
import time

import httpx

from .errors import OAuthError

logger = logging.getLogger(__name__)

_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
_SAFETY_MARGIN_SECONDS = 60


class OAuthManager:
    """Acquires and caches Twitch App Access Tokens (client_credentials grant)."""

    def __init__(self, client_id: str, client_secret: str) -> None:
        if not client_id or not client_secret:
            raise OAuthError(
                "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set. "
                "Register an app at https://dev.twitch.tv/console/apps"
            )
        self._client_id = client_id
        self._client_secret = client_secret
        self._token: str | None = None
        self._expires_at: float = 0.0
        self._lock = asyncio.Lock()

    @property
    def client_id(self) -> str:
        """Return the Twitch Client ID (needed by IGDBProvider for request headers)."""
        return self._client_id

    async def get_token(self) -> str:
        """Return a valid access token, acquiring or refreshing as needed."""
        if self._token and time.monotonic() < self._expires_at:
            return self._token

        async with self._lock:
            # Double-check after acquiring lock.
            if self._token and time.monotonic() < self._expires_at:
                return self._token
            return await self._acquire_token()

    async def _acquire_token(self) -> str:
        """POST to Twitch OAuth and cache the resulting token."""
        params = {
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "grant_type": "client_credentials",
        }

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(_TOKEN_URL, params=params)

                if response.status_code == 200:
                    data = response.json()
                    access_token = data.get("access_token")
                    expires_in = data.get("expires_in", 0)
                    if not access_token:
                        raise OAuthError("Twitch OAuth response missing access_token.")

                    self._token = access_token
                    self._expires_at = time.monotonic() + max(0, expires_in - _SAFETY_MARGIN_SECONDS)
                    logger.info("Twitch OAuth token acquired (expires in %ds).", expires_in)
                    return self._token

                if response.status_code in (401, 403):
                    raise OAuthError("Twitch OAuth credentials are invalid. Check TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.")

                # Transient failure — retry.
                logger.warning("Twitch OAuth returned %d on attempt %d.", response.status_code, attempt + 1)

            except httpx.HTTPError as exc:
                logger.warning("Twitch OAuth network error on attempt %d: %s", attempt + 1, exc)

            if attempt < 2:
                await asyncio.sleep(1.0 * (2 ** attempt))

        raise OAuthError("Failed to acquire Twitch OAuth token after 3 attempts.")

    def invalidate(self) -> None:
        """Force token re-acquisition on next request."""
        self._token = None
        self._expires_at = 0.0
