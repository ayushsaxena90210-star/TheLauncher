from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ...database import get_session
from ...schemas import GameCreate, GameResponse, GameUpdate
from ...services import GameService

router = APIRouter(prefix="/games", tags=["games"])
service = GameService()


@router.get("", response_model=list[GameResponse])
def list_games(session: Session = Depends(get_session)) -> list[GameResponse]:
    return service.list_games(session)


@router.post("", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(payload: GameCreate, session: Session = Depends(get_session)) -> GameResponse:
    return service.create_game(session, payload)


@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: UUID, session: Session = Depends(get_session)) -> GameResponse:
    return service.get_game(session, game_id)


@router.patch("/{game_id}", response_model=GameResponse)
def update_game(
    game_id: UUID, payload: GameUpdate, session: Session = Depends(get_session)
) -> GameResponse:
    return service.update_game(session, game_id, payload)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(game_id: UUID, session: Session = Depends(get_session)) -> Response:
    service.delete_game(session, game_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
