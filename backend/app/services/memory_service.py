"""
MemoryService

Owns the "Knowledge Inbox" flows: file upload, URL ingestion, and quick
notes. Responsible for:
  1. Extracting plain text from whatever was submitted.
  2. Persisting a MemoryUpload metadata row in Postgres.
  3. Calling `CogneeService.remember()` to actually commit it to the graph.
  4. Returning a `MemoryItem` shaped exactly like the frontend's mock type.
"""
from __future__ import annotations

import io
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import UploadFile
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import MemoryUpload, User
from app.schemas.common import MemoryItem, MemoryType
from app.services.cognee_service import CogneeService

logger = logging.getLogger(__name__)

_SUMMARY_MAX_LEN = 220


class MemoryIngestionError(Exception):
    pass


class MemoryService:
    def __init__(self, db: AsyncSession, cognee: CogneeService) -> None:
        self._db = db
        self._cognee = cognee

    # --- public API -------------------------------------------------------

    async def ingest_file(self, user: User, file: UploadFile, project: Optional[str] = None) -> MemoryItem:
        raw = await file.read()
        text = self._extract_text_from_file(filename=file.filename or "upload", raw=raw)
        mem_type = MemoryType.document
        title = file.filename or "Untitled document"
        return await self._ingest(
            user=user,
            title=title,
            mem_type=mem_type,
            text=text,
            source=file.filename or "upload",
            project=project,
        )

    async def ingest_url(self, user: User, url: str, title: Optional[str] = None, project: Optional[str] = None) -> MemoryItem:
        text, page_title = await self._fetch_url_text(url)
        return await self._ingest(
            user=user,
            title=title or page_title or url,
            mem_type=MemoryType.url,
            text=text,
            source=url,
            project=project,
        )

    async def ingest_note(self, user: User, content: str, title: Optional[str] = None, project: Optional[str] = None) -> MemoryItem:
        return await self._ingest(
            user=user,
            title=title or self._derive_title_from_text(content),
            mem_type=MemoryType.note,
            text=content,
            source="Quick note",
            project=project,
        )

    async def list_recent(self, user: User, limit: int = 20) -> list[MemoryItem]:
        result = await self._db.execute(
            select(MemoryUpload)
            .where(MemoryUpload.user_id == user.id)
            .order_by(desc(MemoryUpload.created_at))
            .limit(limit)
        )
        rows = result.scalars().all()
        return [self._to_memory_item(row) for row in rows]

    async def delete_memory(self, user: User, memory_id: str) -> None:
        result = await self._db.execute(
            select(MemoryUpload).where(
                MemoryUpload.id == memory_id, MemoryUpload.user_id == user.id
            )
        )
        row = result.scalar_one_or_none()
        if row is None:
            raise MemoryIngestionError("Memory not found.")
        await self._cognee.forget(dataset=row.cognee_dataset, data_id=row.cognee_data_id)
        await self._db.delete(row)
        await self._db.commit()

    # --- internals --------------------------------------------------------

    async def _ingest(
        self,
        *,
        user: User,
        title: str,
        mem_type: MemoryType,
        text: str,
        source: str,
        project: Optional[str],
    ) -> MemoryItem:
        if not text or not text.strip():
            raise MemoryIngestionError("No extractable text content found.")

        row = MemoryUpload(
            user_id=user.id,
            title=title[:255],
            type=mem_type.value,
            summary=self._summarize(text),
            source=source,
            project=project,
            cognee_dataset=user.cognee_dataset,
            status="processing",
        )
        self._db.add(row)
        await self._db.commit()
        await self._db.refresh(row)

        try:
            data_id = await self._cognee.remember(dataset=user.cognee_dataset, text=text)
            row.cognee_data_id = data_id or None
            row.status = "ready"
        except Exception:
            logger.exception("Cognee remember() failed for memory_id=%s", row.id)
            row.status = "failed"
        await self._db.commit()
        await self._db.refresh(row)

        return self._to_memory_item(row)

    @staticmethod
    def _summarize(text: str) -> str:
        cleaned = " ".join(text.split())
        if len(cleaned) <= _SUMMARY_MAX_LEN:
            return cleaned
        return cleaned[:_SUMMARY_MAX_LEN].rsplit(" ", 1)[0] + "..."

    @staticmethod
    def _derive_title_from_text(text: str) -> str:
        first_line = text.strip().splitlines()[0] if text.strip() else "Quick note"
        return first_line[:80]

    @staticmethod
    def _extract_text_from_file(filename: str, raw: bytes) -> str:
        lowered = filename.lower()
        if lowered.endswith(".pdf"):
            return MemoryService._extract_pdf_text(raw)
        if lowered.endswith((".md", ".markdown", ".txt", ".text")):
            return raw.decode("utf-8", errors="ignore")
        # Best-effort fallback for anything else (transcripts, logs, etc.)
        return raw.decode("utf-8", errors="ignore")

    @staticmethod
    def _extract_pdf_text(raw: bytes) -> str:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(raw))
        pages_text = []
        for page in reader.pages:
            try:
                pages_text.append(page.extract_text() or "")
            except Exception:
                logger.warning("Failed to extract text from a PDF page", exc_info=True)
        return "\n\n".join(pages_text)

    @staticmethod
    async def _fetch_url_text(url: str) -> tuple[str, Optional[str]]:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "ZettaBot/1.0"})
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()

        page_title = soup.title.string.strip() if soup.title and soup.title.string else None
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return "\n".join(lines), page_title

    @staticmethod
    def _to_memory_item(row: MemoryUpload) -> MemoryItem:
        return MemoryItem(
            id=row.id,
            title=row.title,
            type=MemoryType(row.type),
            summary=row.summary,
            source=row.source,
            added_at=MemoryService._humanize_timestamp(row.created_at),
            connections=row.connections,
            project=row.project,
        )

    @staticmethod
    def _humanize_timestamp(dt: datetime) -> str:
        """Render a DB timestamp the same way the frontend mock does
        ("2h ago", "Yesterday", "3 days ago") so no frontend changes needed."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = now - dt
        seconds = delta.total_seconds()

        if seconds < 3600:
            minutes = max(1, int(seconds // 60))
            return f"{minutes}m ago"
        if seconds < 86400:
            hours = int(seconds // 3600)
            return f"{hours}h ago"
        days = int(seconds // 86400)
        if days == 1:
            return "Yesterday"
        if days < 7:
            return f"{days} days ago"
        weeks = days // 7
        if weeks == 1:
            return "Last week"
        return dt.strftime("%b %d")
