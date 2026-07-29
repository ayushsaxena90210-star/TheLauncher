from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Game


class GameRepository:
    """SQLite persistence operations for games."""

    def list(self, session: Session) -> list[Game]:
        return list(session.scalars(select(Game).order_by(Game.title, Game.id)))

    def get(self, session: Session, game_id: UUID) -> Game | None:
        return session.get(Game, game_id)

    def add(self, session: Session, game: Game) -> Game:
        session.add(game)
        session.flush()
        return game

    def delete(self, session: Session, game: Game) -> None:
        session.delete(game)
        session.flush()
