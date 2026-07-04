"""Dashboard route. Business logic lives entirely in DashboardService."""
from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_dashboard_service
from app.models.orm import User
from app.schemas.common import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def read_dashboard(
    user: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    return await service.get_dashboard(user)
