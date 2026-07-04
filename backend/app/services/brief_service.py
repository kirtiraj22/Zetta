"""
BriefService

Generates the daily briefing: today's summary, open commitments, recently
connected topics, people mentioned often, and suggested follow-ups. Uses
`CogneeService.recall()` for retrieval and `OpenRouterService` purely for
turning that retrieved context into natural language. Results are cached
per user/day in Postgres so repeated dashboard loads don't re-trigger
generation.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Commitment as CommitmentRow
from app.models.orm import DailyBriefCache, User
from app.schemas.common import BriefResponse, Commitment, DailyBrief, Person
from app.services.cognee_service import CogneeService
from app.services.openrouter_service import OpenRouterService

logger = logging.getLogger(__name__)

_BRIEF_QUERY = (
    "What are the most important updates, decisions, open questions, and "
    "action items across all of my recent notes, meetings, and documents?"
)

_SYSTEM_PROMPT = """You are Zetta, an AI second brain. You are given raw \
retrieved context from the user's personal knowledge graph (summaries, \
insights, and source excerpts). Write a concise daily briefing.

Respond ONLY with a JSON object with this exact shape, no markdown fences, \
no commentary:
{
  "summary": "2-4 sentence narrative summary of what's changed/matters",
  "highlights": ["short highlight 1", "short highlight 2", "short highlight 3"],
  "followUps": ["suggested follow-up 1", "suggested follow-up 2"]
}
Keep each highlight and follow-up under 20 words. Ground everything in the \
provided context -- do not invent people, projects, or facts not present in it.
"""


class BriefService:
    def __init__(self, db: AsyncSession, cognee: CogneeService, openrouter: OpenRouterService) -> None:
        self._db = db
        self._cognee = cognee
        self._openrouter = openrouter

    async def get_or_generate_brief(self, user: User, force_refresh: bool = False) -> BriefResponse:
        today = datetime.now(timezone.utc).date().isoformat()

        if not force_refresh:
            cached = await self._get_cached(user, today)
            if cached is not None:
                daily_brief = DailyBrief.model_validate(cached.payload)
                return BriefResponse(
                    dailyBrief=daily_brief,
                    openCommitments=await self._get_open_commitments(user),
                    people=await self._get_people(user),
                )

        daily_brief = await self._generate_daily_brief(user)
        await self._cache_brief(user, today, daily_brief)

        return BriefResponse(
            dailyBrief=daily_brief,
            openCommitments=await self._get_open_commitments(user),
            people=await self._get_people(user),
        )

    async def _generate_daily_brief(self, user: User) -> DailyBrief:
        recall_result = await self._cognee.recall(
            dataset=user.cognee_dataset, query=_BRIEF_QUERY, top_k=15
        )
        context = recall_result.as_context_text()
        date_label = datetime.now(timezone.utc).strftime("%A, %B %-d")

        if not context.strip():
            return DailyBrief(
                date=date_label,
                summary=(
                    "Your memory graph doesn't have enough content yet to "
                    "generate a meaningful brief. Add a few notes, documents, "
                    "or meeting summaries and check back."
                ),
                highlights=[],
                followUps=[],
            )

        try:
            raw = await self._openrouter.complete(
                system_prompt=_SYSTEM_PROMPT,
                user_prompt=f"Context from the user's knowledge graph:\n\n{context}",
                temperature=0.3,
                max_tokens=600,
            )
            parsed = self._parse_llm_json(raw)
            return DailyBrief(
                date=date_label,
                summary=parsed.get("summary", "").strip() or "No summary available.",
                highlights=list(parsed.get("highlights", []))[:5],
                followUps=list(parsed.get("followUps", []))[:5],
            )
        except Exception:
            logger.exception("Failed to generate daily brief via OpenRouter")
            return DailyBrief(
                date=date_label,
                summary="We couldn't generate today's brief right now. Please try again shortly.",
                highlights=[],
                followUps=[],
            )

    @staticmethod
    def _parse_llm_json(raw: str) -> dict:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())

    async def _get_cached(self, user: User, today: str) -> DailyBriefCache | None:
        result = await self._db.execute(
            select(DailyBriefCache).where(
                DailyBriefCache.user_id == user.id, DailyBriefCache.brief_date == today
            )
        )
        return result.scalar_one_or_none()

    async def _cache_brief(self, user: User, today: str, brief: DailyBrief) -> None:
        existing = await self._get_cached(user, today)
        payload = brief.model_dump(by_alias=True, mode="json")
        if existing is not None:
            existing.payload = payload
        else:
            self._db.add(DailyBriefCache(user_id=user.id, brief_date=today, payload=payload))
        await self._db.commit()

    async def _get_open_commitments(self, user: User, limit: int = 10) -> list[Commitment]:
        result = await self._db.execute(
            select(CommitmentRow)
            .where(CommitmentRow.user_id == user.id, CommitmentRow.done.is_(False))
            .order_by(CommitmentRow.created_at.desc())
            .limit(limit)
        )
        rows = result.scalars().all()
        return [
            Commitment(
                id=row.id,
                title=row.title,
                due=row.due,
                person=row.person,
                project=row.project,
                done=row.done,
            )
            for row in rows
        ]

    async def _get_people(self, user: User, limit: int = 10) -> list[Person]:
        try:
            graph = await self._cognee.get_graph(dataset=user.cognee_dataset)
        except Exception:
            logger.warning("Could not read graph for people list", exc_info=True)
            return []

        people: list[Person] = []
        for node in graph.get("nodes", []):
            node_type = str(node.get("type", "")).lower()
            if "person" not in node_type:
                continue
            name = str(node.get("name") or node.get("label") or node.get("id"))
            initials = "".join(part[0].upper() for part in name.split()[:2]) or "?"
            people.append(
                Person(
                    id=str(node.get("id")),
                    name=name,
                    role=str(node.get("role") or "Mentioned in your memory"),
                    mentions=int(node.get("mentions", 1)),
                    lastMentioned=str(node.get("last_mentioned") or "Recently"),
                    initials=initials,
                )
            )
        people.sort(key=lambda p: p.mentions, reverse=True)
        return people[:limit]
