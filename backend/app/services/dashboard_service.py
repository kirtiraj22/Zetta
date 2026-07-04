"""
DashboardService

Aggregates everything `GET /dashboard` needs: memory stats, recent memories,
a lightweight activity feed, and today's cached daily brief. Deliberately
avoids triggering a fresh Cognee recall + OpenRouter generation on every
dashboard load -- brief *generation* is owned by `BriefService` and hit via
`GET /brief`; this service only reads whatever is cached.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Commitment, DailyBriefCache, MemoryUpload, User
from app.schemas.common import ActivityItem, DailyBrief, DashboardResponse, MemoryStats
from app.services.cognee_service import CogneeService
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)

_RECENT_LIMIT = 6
_ACTIVITY_LIMIT = 6


class DashboardService:
    def __init__(self, db: AsyncSession, cognee: CogneeService) -> None:
        self._db = db
        self._cognee = cognee

    async def get_dashboard(self, user: User) -> DashboardResponse:
        stats = await self._compute_stats(user)
        memory_service = MemoryService(db=self._db, cognee=self._cognee)
        recent = await memory_service.list_recent(user, limit=_RECENT_LIMIT)
        activity = await self._build_activity_feed(user)
        brief = await self._get_cached_brief_or_placeholder(user)

        return DashboardResponse(
            stats=stats,
            recentMemories=recent,
            dashboardActivity=activity,
            dailyBrief=brief,
        )

    async def _compute_stats(self, user: User) -> MemoryStats:
        total_result = await self._db.execute(
            select(func.count()).select_from(MemoryUpload).where(MemoryUpload.user_id == user.id)
        )
        total_memories = total_result.scalar_one()

        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        new_result = await self._db.execute(
            select(func.count())
            .select_from(MemoryUpload)
            .where(MemoryUpload.user_id == user.id, MemoryUpload.created_at >= week_ago)
        )
        new_this_week = new_result.scalar_one()

        connections_result = await self._db.execute(
            select(func.coalesce(func.sum(MemoryUpload.connections), 0)).where(
                MemoryUpload.user_id == user.id
            )
        )
        connections = connections_result.scalar_one()

        projects_result = await self._db.execute(
            select(func.count(func.distinct(MemoryUpload.project))).where(
                MemoryUpload.user_id == user.id, MemoryUpload.project.is_not(None)
            )
        )
        projects = projects_result.scalar_one()

        people = 0
        try:
            graph = await self._cognee.get_graph(dataset=user.cognee_dataset)
            people = sum(
                1
                for node in graph.get("nodes", [])
                if "person" in str(node.get("type", "")).lower()
            )
        except Exception:
            logger.warning("Could not compute people count from graph", exc_info=True)

        storage_label = f"{total_memories} memories in your graph"

        return MemoryStats(
            totalMemories=total_memories,
            newThisWeek=new_this_week,
            connections=int(connections),
            projects=projects,
            people=people,
            storageUsedLabel=storage_label,
        )

    async def _build_activity_feed(self, user: User) -> list[ActivityItem]:
        result = await self._db.execute(
            select(MemoryUpload)
            .where(MemoryUpload.user_id == user.id)
            .order_by(MemoryUpload.created_at.desc())
            .limit(_ACTIVITY_LIMIT)
        )
        rows = result.scalars().all()
        items: list[ActivityItem] = []
        for row in rows:
            if row.status == "ready":
                label = f"Added \u201c{row.title}\u201d to memory"
            elif row.status == "failed":
                label = f"Failed to process \u201c{row.title}\u201d"
            else:
                label = f"Processing \u201c{row.title}\u201d"
            items.append(
                ActivityItem(
                    id=f"a_{row.id}",
                    label=label,
                    time=MemoryService._humanize_timestamp(row.created_at),
                )
            )
        return items

    async def _get_cached_brief_or_placeholder(self, user: User) -> DailyBrief:
        today = datetime.now(timezone.utc).date().isoformat()
        result = await self._db.execute(
            select(DailyBriefCache).where(
                DailyBriefCache.user_id == user.id, DailyBriefCache.brief_date == today
            )
        )
        row = result.scalar_one_or_none()
        if row is not None:
            return DailyBrief.model_validate(row.payload)

        return DailyBrief(
            date=datetime.now(timezone.utc).strftime("%A, %B %-d"),
            summary=(
                "No brief has been generated yet today. Visit the Daily Brief "
                "page to have Zetta summarize what's changed across your memory."
            ),
            highlights=[],
            followUps=[],
        )
