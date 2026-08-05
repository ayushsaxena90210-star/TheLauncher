from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ...database import get_session
from ...schemas import GameActivityResponse, RecentGameResponse, SessionComplete, SessionCreate, SessionResponse
from ...services import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])
service = SessionService()


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate, session: Session = Depends(get_session)
) -> SessionResponse:
    return service.create_session(session, payload)


@router.patch("/{session_id}", response_model=SessionResponse)
def complete_session(
    session_id: UUID,
    payload: SessionComplete,
    session: Session = Depends(get_session),
) -> SessionResponse:
    return service.complete_session(session, session_id, payload)


@router.get("/recent", response_model=list[RecentGameResponse])
def recent_games(
    limit: int = Query(default=8, ge=1, le=20),
    session: Session = Depends(get_session),
) -> list[RecentGameResponse]:
    rows = service.recent_games(session, limit)
    return [RecentGameResponse.model_validate(dict(row._mapping)) for row in rows]


@router.get("/games/{game_id}/activity", response_model=GameActivityResponse)
def game_activity(game_id: UUID, limit: int = Query(default=12, ge=1, le=50), session: Session = Depends(get_session)) -> dict:
    return service.game_activity(session, game_id, limit)
