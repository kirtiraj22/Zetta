"""Daily brief route. Generation logic lives in BriefService."""
from fastapi import APIRouter, Depends, Query

from app.dependencies import get_brief_service, get_current_user
from app.models.orm import User
from app.schemas.common import BriefResponse
from app.services.brief_service import BriefService

router = APIRouter(tags=["brief"])


@router.get("/brief", response_model=BriefResponse)
async def read_brief(
    refresh: bool = Query(default=False, description="Force regeneration instead of using today's cache"),
    user: User = Depends(get_current_user),
    service: BriefService = Depends(get_brief_service),
) -> BriefResponse:
    return await service.get_or_generate_brief(user, force_refresh=refresh)
