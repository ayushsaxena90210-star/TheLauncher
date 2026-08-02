from datetime import date, datetime
from pathlib import Path
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_absolute_path(value: str) -> str:
    path = Path(value).expanduser()
    if not path.is_absolute():
        raise ValueError("Path must be absolute.")
    return str(path.resolve(strict=False))


class GameFields(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    executable_path: str = Field(min_length=1, max_length=2048)
    install_path: str | None = Field(default=None, max_length=2048)
    cover_path: str | None = Field(default=None, max_length=2048)
    description: str | None = None
    release_date: date | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("Title must not be blank.")
        return normalized_value

    @field_validator("executable_path", "install_path", "cover_path")
    @classmethod
    def normalize_path(cls, value: str | None) -> str | None:
        return normalize_absolute_path(value) if value is not None else None


class GameCreate(GameFields):
    pass


class GameUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    executable_path: str | None = Field(default=None, min_length=1, max_length=2048)
    install_path: str | None = Field(default=None, max_length=2048)
    cover_path: str | None = Field(default=None, max_length=2048)
    description: str | None = None
    release_date: date | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("Title must not be blank.")
        return normalized_value

    @field_validator("executable_path", "install_path", "cover_path")
    @classmethod
    def normalize_path(cls, value: str | None) -> str | None:
        return normalize_absolute_path(value) if value is not None else None


class GameResponse(GameFields):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    igdb_id: int | None = None
    metadata_source: str | None = None
    metadata_confidence: float | None = None
    genres: str | None = None
    created_at: datetime
    updated_at: datetime


class SessionCreate(BaseModel):
    game_id: UUID


class SessionComplete(BaseModel):
    ended_at: datetime
    duration_seconds: int = Field(ge=0)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    game_id: UUID
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None


class RecentGameResponse(BaseModel):
    game_id: UUID
    game_title: str
    game_executable_path: str
    game_cover_path: str | None = None
    last_played_at: datetime
    total_play_time_seconds: int


class ScanStartRequest(BaseModel):
    roots: list[str] = Field(min_length=1, max_length=32)

    @field_validator("roots")
    @classmethod
    def normalize_roots(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(normalize_absolute_path(value) for value in values))


class ScanCandidateResponse(BaseModel):
    id: str
    display_name: str
    executable_path: str
    root_folder: str
    already_imported: bool
    reason_skipped: str | None = None
    file_size: int | None = None
    modified_at: datetime | None = None


class ScanSummaryResponse(BaseModel):
    folders_scanned: int
    directories_visited: int
    executables_checked: int
    games_detected: int
    already_imported_games: int
    excluded_items: int
    permission_warnings: int
    successfully_imported_games: int = 0


class ScanStatusResponse(BaseModel):
    scan_id: str
    state: str
    current_path: str | None = None
    summary: ScanSummaryResponse
    candidates: list[ScanCandidateResponse] = []
    warnings: list[str] = []
    error: str | None = None


class ScanImportRequest(BaseModel):
    candidate_ids: list[str] = Field(default_factory=list, max_length=10_000)


class ScanImportResponse(BaseModel):
    scan_id: str
    imported_count: int
    skipped_count: int
    imported_game_ids: list[str] = []
    summary: ScanSummaryResponse


# ----- Metadata schemas -----

class MetadataRefreshResponse(BaseModel):
    game_id: str
    state: str
    message: str | None = None


class MetadataStatusResponse(BaseModel):
    queue_size: int
    processing: dict | None = None
    recent: list[dict] = Field(default_factory=list)


class MetadataGameStatusResponse(BaseModel):
    game_id: str
    metadata_status: str | None = None
