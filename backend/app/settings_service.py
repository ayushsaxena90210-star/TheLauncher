"""Local-settings business logic kept separate from Electron and renderer concerns."""

from __future__ import annotations

import json
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import AppSetting, Game, ScanRoot
from .schemas import ScanOptions, ScanRootCreate, SettingsResponse, SettingsUpdate

THEME_KEY = "theme"
SCAN_OPTIONS_KEY = "scan_options"
CACHE_LAST_CLEANUP_KEY = "cache_last_cleanup_at"


class SettingsService:
    def get_settings(self, session: Session) -> SettingsResponse:
        return SettingsResponse(
            theme=self._get_value(session, THEME_KEY, "system"),
            scan_options=ScanOptions(**self._get_value(session, SCAN_OPTIONS_KEY, {})),
        )

    def update_settings(self, session: Session, payload: SettingsUpdate) -> SettingsResponse:
        values = payload.model_dump(exclude_none=True)
        for key, value in values.items():
            self._set_value(session, key, value.model_dump() if hasattr(value, "model_dump") else value)
        session.commit()
        return self.get_settings(session)

    def list_scan_roots(self, session: Session) -> list[ScanRoot]:
        return list(session.scalars(select(ScanRoot).order_by(ScanRoot.path)))

    def add_scan_root(self, session: Session, payload: ScanRootCreate) -> ScanRoot:
        root = ScanRoot(path=payload.path)
        session.add(root)
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "duplicate_scan_root", "message": "This scan folder is already saved."},
            ) from error
        session.refresh(root)
        return root

    def remove_scan_root(self, session: Session, root_id: UUID) -> None:
        root = session.get(ScanRoot, root_id)
        if root is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "scan_root_not_found", "message": "The scan folder was not found."},
            )
        session.delete(root)
        session.commit()

    def active_scan_roots(self, session: Session) -> list[str]:
        return list(session.scalars(select(ScanRoot.path).where(ScanRoot.enabled.is_(True)).order_by(ScanRoot.path)))

    def library_size(self, session: Session) -> int:
        return int(session.scalar(select(func.count(Game.id))) or 0)

    def last_metadata_refresh(self, session: Session) -> datetime | None:
        return session.scalar(select(func.max(Game.updated_at)).where(Game.metadata_source.is_not(None)))

    def last_cleanup(self, session: Session) -> datetime | None:
        value = self._get_value(session, CACHE_LAST_CLEANUP_KEY, None)
        return datetime.fromisoformat(value) if isinstance(value, str) else None

    def mark_cleanup(self, session: Session, occurred_at: datetime) -> None:
        self._set_value(session, CACHE_LAST_CLEANUP_KEY, occurred_at.isoformat())
        session.commit()

    @staticmethod
    def referenced_artwork_paths(session: Session) -> set[str]:
        return set(session.scalars(select(Game.cover_path).where(Game.cover_path.is_not(None))))

    @staticmethod
    def clear_artwork_references(session: Session) -> None:
        for game in session.scalars(select(Game)):
            game.cover_path = None
            game.screenshot_paths = None

    @staticmethod
    def _get_value(session: Session, key: str, default):
        setting = session.get(AppSetting, key)
        if setting is None:
            return default
        try:
            return json.loads(setting.value_json)
        except json.JSONDecodeError:
            return default

    @staticmethod
    def _set_value(session: Session, key: str, value) -> None:
        encoded = json.dumps(value)
        setting = session.get(AppSetting, key)
        if setting is None:
            session.add(AppSetting(key=key, value_json=encoded))
        else:
            setting.value_json = encoded
