"""Chat route. Streams Server-Sent Events; all logic lives in ChatService."""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_chat_service, get_current_user
from app.models.orm import User
from app.schemas.common import ChatMessage, ChatRequest
from app.services.chat_service import ChatService

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    conversation = await service.get_or_create_conversation(user, payload.conversation_id)

    async def event_stream():
        yield f"event: conversation\ndata: {conversation.id}\n\n"
        async for chunk in service.stream_reply(user, conversation, payload.message):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/chat/{conversation_id}/history", response_model=list[ChatMessage])
async def chat_history(
    conversation_id: str,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> list[ChatMessage]:
    return await service.get_history(user, conversation_id)
