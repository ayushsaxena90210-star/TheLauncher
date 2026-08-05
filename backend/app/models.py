from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Game(Base):
    """A locally installed game in the user's library."""

    __tablename__ = "games"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    executable_path: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True)
    install_path: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    cover_path: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    release_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Phase 6: Metadata fields
    igdb_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    metadata_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    genres: Mapped[str | None] = mapped_column(String(500), nullable=True)
    developers: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publishers: Mapped[str | None] = mapped_column(String(500), nullable=True)
    platforms: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    age_rating: Mapped[str | None] = mapped_column(String(100), nullable=True)
    themes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    franchises: Mapped[str | None] = mapped_column(String(500), nullable=True)
    game_modes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    official_website: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    screenshot_paths: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class GameSession(Base):
    """An immutable record of a game play session."""

    __tablename__ = "game_sessions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    game_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AppSetting(Base):
    """A versioned, local preference value owned by the FastAPI service."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value_json: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class ScanRoot(Base):
    """A user-approved library folder retained for later scans."""

    __tablename__ = "scan_roots"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    path: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
