from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


async def validation_error_handler(_: Request, __: RequestValidationError) -> JSONResponse:
    """Return validation failures using the API's stable local error contract."""

    return JSONResponse(
        status_code=422,
        content={"detail": {"code": "validation_error", "message": "Request validation failed."}},
    )
