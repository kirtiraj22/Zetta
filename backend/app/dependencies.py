"""
Shared FastAPI dependencies: DB sessions, authenticated user, and services.

Routes should only ever depend on things declared here -- they must not
import services or the DB session directly, keeping route handlers thin.
"""
from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import TokenVerificationError, verify_supabase_token
from app.models.orm import User
from app.services.auth_service import AuthService
from app.services.brief_service import BriefService
from app.services.chat_service import ChatService
from app.services.cognee_service import CogneeService
from app.services.dashboard_service import DashboardService
from app.services.graph_service import GraphService
from app.services.memory_service import MemoryService
from app.services.openrouter_service import OpenRouterService
from app.services.search_service import SearchService

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Verify the Supabase-issued bearer token and resolve the local User."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        supabase_user = verify_supabase_token(credentials.credentials)
    except TokenVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    auth_service = AuthService(db)
    return await auth_service.get_or_create_user(supabase_user)


# --- Singletons / stateless services -----------------------------------

_cognee_service = CogneeService()
_openrouter_service = OpenRouterService()


def get_cognee_service() -> CogneeService:
    return _cognee_service


def get_openrouter_service() -> OpenRouterService:
    return _openrouter_service


def get_memory_service(
    db: AsyncSession = Depends(get_db),
    cognee: CogneeService = Depends(get_cognee_service),
) -> MemoryService:
    return MemoryService(db=db, cognee=cognee)


def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
    cognee: CogneeService = Depends(get_cognee_service),
) -> DashboardService:
    return DashboardService(db=db, cognee=cognee)


def get_graph_service(
    cognee: CogneeService = Depends(get_cognee_service),
) -> GraphService:
    return GraphService(cognee=cognee)


def get_search_service(
    db: AsyncSession = Depends(get_db),
    cognee: CogneeService = Depends(get_cognee_service),
) -> SearchService:
    return SearchService(db=db, cognee=cognee)


def get_chat_service(
    db: AsyncSession = Depends(get_db),
    cognee: CogneeService = Depends(get_cognee_service),
    openrouter: OpenRouterService = Depends(get_openrouter_service),
) -> ChatService:
    return ChatService(db=db, cognee=cognee, openrouter=openrouter)


def get_brief_service(
    db: AsyncSession = Depends(get_db),
    cognee: CogneeService = Depends(get_cognee_service),
    openrouter: OpenRouterService = Depends(get_openrouter_service),
) -> BriefService:
    return BriefService(db=db, cognee=cognee, openrouter=openrouter)
