"""
SearchService

Runs semantic search against a user's Cognee memory graph via `recall()`,
then reconciles the results against our Postgres `memory_uploads` metadata
table so the response matches the frontend's `MemoryItem` shape (title,
summary, source, connections, project, type) exactly.
"""
from __future__ import annotations

import logging

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import MemoryUpload, User
from app.schemas.common import MemoryItem, MemoryType
from app.services.cognee_service import CogneeService
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self, db: AsyncSession, cognee: CogneeService) -> None:
        self._db = db
        self._cognee = cognee

    async def search(self, user: User, query: str, limit: int = 20) -> list[MemoryItem]:
        if not query or not query.strip():
            return await self._recent_fallback(user, limit)

        recall_result = await self._cognee.recall(dataset=user.cognee_dataset, query=query, top_k=limit)

        # Cognee gives us *semantic* relevance signals (summaries/insights/
        # chunks); we reconcile those against our metadata table to recover
        # the structured fields the frontend needs (project, source, etc).
        candidate_texts = [*recall_result.summaries]
        for chunk in recall_result.chunks:
            text = chunk.get("text") if isinstance(chunk, dict) else str(chunk)
            if text:
                candidate_texts.append(text)

        matched_rows = await self._match_rows(user, query, candidate_texts, limit)
        return [MemoryService._to_memory_item(row) for row in matched_rows]

    async def _match_rows(
        self, user: User, query: str, candidate_texts: list[str], limit: int
    ) -> list[MemoryUpload]:
        # Cheap relevance heuristic layered on top of Cognee's semantic recall:
        # prefer rows whose title/summary overlaps with recalled text or the
        # raw query, then fall back to recency.
        result = await self._db.execute(
            select(MemoryUpload).where(MemoryUpload.user_id == user.id)
        )
        rows = result.scalars().all()
        if not rows:
            return []

        haystacks = [query.lower()] + [t.lower() for t in candidate_texts]

        def score(row: MemoryUpload) -> int:
            row_text = f"{row.title} {row.summary}".lower()
            return sum(1 for h in haystacks if any(tok in row_text for tok in h.split() if len(tok) > 3))

        scored = sorted(rows, key=score, reverse=True)
        top = [r for r in scored if score(r) > 0][:limit]
        if top:
            return top
        # Nothing scored (e.g. brand-new dataset) -- fall back to plain
        # substring search so the UI never shows an empty result for a
        # query that clearly matches a title.
        like_query = f"%{query.lower()}%"
        result = await self._db.execute(
            select(MemoryUpload)
            .where(
                MemoryUpload.user_id == user.id,
                or_(
                    MemoryUpload.title.ilike(like_query),
                    MemoryUpload.summary.ilike(like_query),
                ),
            )
            .limit(limit)
        )
        return list(result.scalars().all())

    async def _recent_fallback(self, user: User, limit: int) -> list[MemoryItem]:
        memory_service = MemoryService(db=self._db, cognee=self._cognee)
        return await memory_service.list_recent(user, limit=limit)
