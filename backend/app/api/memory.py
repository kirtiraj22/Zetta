"""Memory (Knowledge Inbox) routes. Thin wrappers over MemoryService."""
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.dependencies import get_current_user, get_memory_service
from app.models.orm import User
from app.schemas.common import MemoryItem, NoteCreateRequest, UrlCreateRequest
from app.services.memory_service import MemoryIngestionError, MemoryService

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/upload", response_model=MemoryItem, status_code=status.HTTP_201_CREATED)
async def upload_memory(
    file: UploadFile = File(...),
    project: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryItem:
    try:
        return await service.ingest_file(user, file, project=project)
    except MemoryIngestionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/url", response_model=MemoryItem, status_code=status.HTTP_201_CREATED)
async def add_url_memory(
    payload: UrlCreateRequest,
    user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryItem:
    try:
        return await service.ingest_url(user, payload.url, title=payload.title, project=payload.project)
    except MemoryIngestionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/note", response_model=MemoryItem, status_code=status.HTTP_201_CREATED)
async def add_note_memory(
    payload: NoteCreateRequest,
    user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryItem:
    try:
        return await service.ingest_note(user, payload.content, title=payload.title, project=payload.project)
    except MemoryIngestionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/recent", response_model=list[MemoryItem])
async def list_recent_memories(
    limit: int = Query(default=20, le=100),
    user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
) -> list[MemoryItem]:
    return await service.list_recent(user, limit=limit)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
) -> Response:
    try:
        await service.delete_memory(user, memory_id)
    except MemoryIngestionError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
