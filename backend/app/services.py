from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Game, GameSession
from .repositories import GameRepository, SessionRepository
from .schemas import GameCreate, GameUpdate, SessionComplete, SessionCreate


class GameService:
    """Business operations for the initial local game record API."""

    def __init__(self, repository: GameRepository | None = None) -> None:
        self.repository = repository or GameRepository()

    def list_games(self, session: Session) -> list[Game]:
        return self.repository.list(session)

    def get_game(self, session: Session, game_id: UUID) -> Game:
        game = self.repository.get(session, game_id)
        if game is None:
            self._not_found(game_id)
        return game

    def create_game(self, session: Session, payload: GameCreate) -> Game:
        return self._commit(session, lambda: self.repository.add(session, Game(**payload.model_dump())))

    def update_game(self, session: Session, game_id: UUID, payload: GameUpdate) -> Game:
        game = self.get_game(session, game_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(game, field, value)
        return self._commit(session, lambda: game)

    def delete_game(self, session: Session, game_id: UUID) -> None:
        game = self.get_game(session, game_id)
        self._commit(session, lambda: self.repository.delete(session, game))

    def _commit(self, session: Session, operation):
        try:
            result = operation()
            session.commit()
            if isinstance(result, Game):
                session.refresh(result)
            return result
        except IntegrityError as error:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "duplicate_executable_path",
                    "message": "A game already uses this executable path.",
                },
            ) from error

    @staticmethod
    def _not_found(game_id: UUID) -> None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "game_not_found", "message": f"Game {game_id} was not found."},
        )


class SessionService:
    """Business operations for play session tracking."""

    def __init__(
        self,
        repository: SessionRepository | None = None,
        game_repository: GameRepository | None = None,
    ) -> None:
        self.repository = repository or SessionRepository()
        self.game_repository = game_repository or GameRepository()

    def create_session(self, session: Session, payload: SessionCreate) -> GameSession:
        game = self.game_repository.get(session, payload.game_id)
        if game is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "game_not_found", "message": f"Game {payload.game_id} was not found."},
            )
        game_session = GameSession(game_id=payload.game_id)
        self.repository.add(session, game_session)
        session.commit()
        session.refresh(game_session)
        return game_session

    def complete_session(
        self, session: Session, session_id: UUID, payload: SessionComplete
    ) -> GameSession:
        game_session = self.repository.get(session, session_id)
        if game_session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "session_not_found", "message": f"Session {session_id} was not found."},
            )
        if game_session.ended_at is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "session_already_completed",
                    "message": "This session has already been completed.",
                },
            )
        game_session.ended_at = payload.ended_at
        game_session.duration_seconds = payload.duration_seconds
        session.commit()
        session.refresh(game_session)
        return game_session

    def recent_games(self, session: Session, limit: int = 8) -> list:
        return self.repository.recent(session, limit)

    def game_activity(self, session: Session, game_id: UUID, limit: int = 12) -> dict:
        if self.game_repository.get(session, game_id) is None:
            GameService._not_found(game_id)
        total, last_played, launch_count, sessions = self.repository.activity_for_game(session, game_id, limit)
        return {"total_play_time_seconds": total, "last_played_at": last_played, "launch_count": launch_count, "sessions": sessions}

    def recover_orphaned_sessions(self, session: Session) -> int:
        count = self.repository.recover_orphans(session)
        if count > 0:
            session.commit()
        return count

