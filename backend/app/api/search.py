"""Search route. Semantic search via SearchService (Cognee recall under the hood)."""
from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user, get_search_service
from app.models.orm import User
from app.schemas.common import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(tags=["search"])

_FILTER_CHIPS = ["All", "Documents", "URLs", "Notes", "Meetings", "Research", "People", "Projects"]


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(default="", description="Free-text semantic search query"),
    limit: int = Query(default=20, le=100),
    user: User = Depends(get_current_user),
    service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    results = await service.search(user, q, limit=limit)
    return SearchResponse(results=results, filterChips=_FILTER_CHIPS)
