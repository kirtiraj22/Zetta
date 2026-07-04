"""
ChatService

Implements the chat pipeline described in the spec:
  1. retrieve memory from Cognee (recall)
  2. build a grounded prompt
  3. call OpenRouter
  4. stream the answer back to the client
Also persists conversation + message history so `ChatMessage` rows can be
replayed, matching the frontend's `ChatMessage` type (including `sources`).
"""
from __future__ import annotations

import json
import logging
from typing import AsyncGenerator, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import ChatMessageRow, Conversation, User
from app.schemas.common import ChatMessage, ChatRole, ChatSource, MemoryType
from app.services.cognee_service import CogneeService
from app.services.openrouter_service import OpenRouterService

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are Zetta, the user's AI second brain. Answer using \
ONLY the retrieved memory context provided below -- this is the user's own \
notes, documents, meetings, and research, retrieved from their personal \
knowledge graph. If the context doesn't contain the answer, say so plainly \
instead of guessing. Be direct, concise, and reference specific people, \
projects, or decisions from the context when relevant. Do not mention that \
you are "retrieving" or "searching" -- just answer naturally, the way \
someone with a great memory would.
"""


class ChatService:
    def __init__(self, db: AsyncSession, cognee: CogneeService, openrouter: OpenRouterService) -> None:
        self._db = db
        self._cognee = cognee
        self._openrouter = openrouter

    async def get_or_create_conversation(self, user: User, conversation_id: Optional[str]) -> Conversation:
        if conversation_id:
            result = await self._db.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id, Conversation.user_id == user.id
                )
            )
            conversation = result.scalar_one_or_none()
            if conversation is not None:
                return conversation

        conversation = Conversation(user_id=user.id, title="New conversation")
        self._db.add(conversation)
        await self._db.commit()
        await self._db.refresh(conversation)
        return conversation

    async def stream_reply(
        self, user: User, conversation: Conversation, message: str
    ) -> AsyncGenerator[str, None]:
        """Yields Server-Sent-Event-formatted chunks. The final event carries
        the full structured `ChatMessage` (including sources) so the client
        can reconcile it with `sampleConversation`'s shape once streaming ends.
        """
        user_row = ChatMessageRow(
            conversation_id=conversation.id, role="user", content=message
        )
        self._db.add(user_row)
        await self._db.commit()

        recall_result = await self._cognee.recall(
            dataset=user.cognee_dataset, query=message, top_k=8
        )
        context = recall_result.as_context_text()
        sources = self._extract_sources(recall_result)

        user_prompt = (
            f"Retrieved memory context:\n{context or '(no relevant memory found)'}\n\n"
            f"User question: {message}"
        )

        full_answer = ""
        async for token in self._openrouter.stream_complete(
            system_prompt=_SYSTEM_PROMPT, user_prompt=user_prompt
        ):
            full_answer += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        assistant_row = ChatMessageRow(
            conversation_id=conversation.id,
            role="assistant",
            content=full_answer,
            sources=[s.model_dump(by_alias=True) for s in sources],
        )
        self._db.add(assistant_row)
        await self._db.commit()
        await self._db.refresh(assistant_row)

        final_message = ChatMessage(
            id=assistant_row.id,
            role=ChatRole.assistant,
            content=full_answer,
            sources=sources,
        )
        yield f"data: {json.dumps({'type': 'done', 'message': final_message.model_dump(by_alias=True)})}\n\n"

    @staticmethod
    def _extract_sources(recall_result) -> list[ChatSource]:
        sources: list[ChatSource] = []
        seen: set[str] = set()
        for chunk in recall_result.chunks[:4]:
            title = None
            if isinstance(chunk, dict):
                title = chunk.get("document_name") or chunk.get("title")
            if not title:
                continue
            if title in seen:
                continue
            seen.add(title)
            sources.append(ChatSource(title=title, type=MemoryType.document))
        return sources

    async def get_history(self, user: User, conversation_id: str) -> list[ChatMessage]:
        conv_result = await self._db.execute(
            select(Conversation.id).where(
                Conversation.id == conversation_id, Conversation.user_id == user.id
            )
        )
        if conv_result.scalar_one_or_none() is None:
            return []

        result = await self._db.execute(
            select(ChatMessageRow)
            .where(ChatMessageRow.conversation_id == conversation_id)
            .order_by(ChatMessageRow.created_at)
        )
        rows = result.scalars().all()

        return [
            ChatMessage(
                id=row.id,
                role=ChatRole(row.role),
                content=row.content,
                sources=[ChatSource(**s) for s in (row.sources or [])] or None,
            )
            for row in rows
        ]
