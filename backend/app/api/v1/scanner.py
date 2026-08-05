from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ...database import get_session
from ...scanner import ScannerService
from ...metadata.runtime import get_metadata_service, metadata_is_configured
from ...schemas import ScanImportRequest, ScanImportResponse, ScanStartRequest, ScanStatusResponse
from ...settings_service import SettingsService

router = APIRouter(prefix="/scanner", tags=["scanner"])
service = ScannerService()


@router.post("/scans", response_model=ScanStatusResponse, status_code=status.HTTP_201_CREATED)
def start_scan(payload: ScanStartRequest, session: Session = Depends(get_session)) -> dict:
    job = service.start(payload.roots, session)
    return service.snapshot(job.id)


@router.get("/scans/{scan_id}", response_model=ScanStatusResponse)
def get_scan(scan_id: str) -> dict:
    return service.snapshot(scan_id)


@router.post("/scans/{scan_id}/cancel", response_model=ScanStatusResponse)
def cancel_scan(scan_id: str) -> dict:
    service.cancel(scan_id)
    return service.snapshot(scan_id)


@router.post("/scans/{scan_id}/imports", response_model=ScanImportResponse)
async def import_scan_candidates(
    scan_id: str, payload: ScanImportRequest, session: Session = Depends(get_session)
) -> dict:
    imported, skipped, imported_game_ids, job = service.import_candidates(scan_id, payload.candidate_ids, session)
    if imported_game_ids and metadata_is_configured() and SettingsService().get_settings(session).scan_options.queue_metadata:
        await get_metadata_service().enqueue_many(imported_game_ids)
    return {
        "scan_id": scan_id,
        "imported_count": imported,
        "skipped_count": skipped,
        "summary": service.snapshot(job.id)["summary"],
    }
