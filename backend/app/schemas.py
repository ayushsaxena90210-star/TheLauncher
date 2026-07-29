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
    created_at: datetime
    updated_at: datetime
