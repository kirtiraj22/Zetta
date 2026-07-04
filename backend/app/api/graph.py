"""Graph route. Returns React-Flow-ready nodes/edges, no frontend transform needed."""
from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_graph_service
from app.models.orm import User
from app.schemas.common import GraphResponse
from app.services.graph_service import GraphService

router = APIRouter(tags=["graph"])


@router.get("/graph", response_model=GraphResponse)
async def read_graph(
    user: User = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
) -> GraphResponse:
    return await service.get_graph(user)
