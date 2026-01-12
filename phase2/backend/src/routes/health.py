"""Health check endpoint."""

from datetime import datetime, timezone

from fastapi import APIRouter

from ..schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return the health status of the API."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
    )
