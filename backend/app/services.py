from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Game
from .repositories import GameRepository
from .schemas import GameCreate, GameUpdate


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
