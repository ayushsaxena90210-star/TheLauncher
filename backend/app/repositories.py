from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Game, GameSession


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


class SessionRepository:
    """SQLite persistence operations for game sessions."""

    def add(self, session: Session, game_session: GameSession) -> GameSession:
        session.add(game_session)
        session.flush()
        return game_session

    def get(self, session: Session, session_id: UUID) -> GameSession | None:
        return session.get(GameSession, session_id)

    def recover_orphans(self, session: Session) -> int:
        stmt = select(GameSession).where(GameSession.ended_at.is_(None))
        orphans = list(session.scalars(stmt))
        for orphan in orphans:
            orphan.ended_at = orphan.started_at
            orphan.duration_seconds = 0
        if orphans:
            session.flush()
        return len(orphans)

    def recent(self, session: Session, limit: int = 8) -> list:
        stmt = (
            select(
                GameSession.game_id,
                Game.title.label("game_title"),
                Game.executable_path.label("game_executable_path"),
                Game.cover_path.label("game_cover_path"),
                func.max(GameSession.started_at).label("last_played_at"),
                func.coalesce(func.sum(GameSession.duration_seconds), 0).label(
                    "total_play_time_seconds"
                ),
            )
            .join(Game, GameSession.game_id == Game.id)
            .group_by(
                GameSession.game_id,
                Game.title,
                Game.executable_path,
                Game.cover_path,
            )
            .order_by(func.max(GameSession.started_at).desc())
            .limit(limit)
        )
        return list(session.execute(stmt).all())

    def activity_for_game(self, session: Session, game_id: UUID, limit: int = 12) -> tuple[int, object | None, int, list[GameSession]]:
        totals = session.execute(select(func.coalesce(func.sum(GameSession.duration_seconds), 0), func.max(GameSession.started_at), func.count(GameSession.id)).where(GameSession.game_id == game_id)).one()
        sessions = list(session.scalars(select(GameSession).where(GameSession.game_id == game_id).order_by(GameSession.started_at.desc()).limit(limit)))
        return int(totals[0] or 0), totals[1], int(totals[2] or 0), sessions
