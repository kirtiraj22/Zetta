"""Auth routes. Thin: verification lives in core.security / dependencies."""
from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.orm import User
from app.schemas.common import MeResponse

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=MeResponse)
async def read_me(user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        displayName=user.display_name,
        createdAt=user.created_at,
    )
