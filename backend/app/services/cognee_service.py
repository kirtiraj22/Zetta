"""
CogneeService

This is the single integration point with the Cognee SDK. No route and no
other service is allowed to import `cognee` directly -- everything goes
through `remember()`, `recall()`, `improve()`, and `forget()` here.

Each Zetta user gets their own Cognee "dataset" (`user.cognee_dataset`) so
that memory graphs never bleed across accounts.
"""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_configured = False
_configure_lock = asyncio.Lock()


def _configure_environment() -> None:
    """Map our Settings onto the env vars the Cognee SDK reads on import."""
    global _configured
    if _configured:
        return

    os.environ.setdefault("LLM_API_KEY", settings.COGNEE_LLM_API_KEY)
    os.environ.setdefault("LLM_PROVIDER", settings.COGNEE_LLM_PROVIDER)
    os.environ.setdefault("LLM_MODEL", settings.COGNEE_LLM_MODEL)
    os.environ.setdefault("GRAPH_DATABASE_PROVIDER", settings.COGNEE_GRAPH_DATABASE_PROVIDER)
    os.environ.setdefault("VECTOR_DB_PROVIDER", settings.COGNEE_VECTOR_DB_PROVIDER)
    os.environ.setdefault("DB_PROVIDER", settings.COGNEE_DB_PROVIDER)
    os.environ.setdefault("DB_NAME", settings.COGNEE_DB_NAME)
    os.makedirs(settings.COGNEE_DATA_ROOT, exist_ok=True)
    _configured = True


@dataclass
class RecallResult:
    """Normalized recall() output, independent of which SearchType was used."""

    summaries: list[str] = field(default_factory=list)
    chunks: list[dict[str, Any]] = field(default_factory=list)
    insights: list[dict[str, Any]] = field(default_factory=list)

    def as_context_text(self, max_chars: int = 6000) -> str:
        """Flatten recall results into a single context blob for the LLM prompt."""
        parts: list[str] = []
        if self.summaries:
            parts.append("Summaries:\n" + "\n".join(f"- {s}" for s in self.summaries))
        if self.insights:
            rendered = "\n".join(f"- {i}" for i in self.insights)
            parts.append(f"Related facts:\n{rendered}")
        if self.chunks:
            rendered = "\n".join(
                f"- {c.get('text', c)[:400]}" if isinstance(c, dict) else f"- {str(c)[:400]}"
                for c in self.chunks
            )
            parts.append(f"Source excerpts:\n{rendered}")
        text = "\n\n".join(parts)
        return text[:max_chars]


class CogneeService:
    """Thin async wrapper around the Cognee SDK's four core operations."""

    def __init__(self) -> None:
        _configure_environment()

    async def _ensure_user_configured(self, dataset: str) -> None:
        """Cognee configures storage per-process; nothing dataset-specific
        needs to happen here beyond making sure env is set once."""
        _configure_environment()

    # --- remember -----------------------------------------------------------

    async def remember(
        self,
        *,
        dataset: str,
        text: str,
        node_set: Optional[list[str]] = None,
    ) -> str:
        """Ingest `text` into the user's Cognee dataset and run cognify.

        Returns a best-effort identifier for the ingested data point (used
        for bookkeeping in Postgres; Cognee is still the source of truth).
        """
        await self._ensure_user_configured(dataset)
        import cognee  # local import: keeps Cognee optional at module import time

        add_result = await cognee.add(text, dataset)
        cognify_result = await cognee.cognify([dataset])

        data_id = self._extract_data_id(add_result)
        logger.info(
            "Cognee remember() complete for dataset=%s data_id=%s (cognify=%s)",
            dataset,
            data_id,
            bool(cognify_result),
        )
        return data_id or ""

    @staticmethod
    def _extract_data_id(add_result: Any) -> Optional[str]:
        try:
            if isinstance(add_result, list) and add_result:
                first = add_result[0]
                return str(getattr(first, "id", None) or first.get("id"))
            if isinstance(add_result, dict):
                return str(add_result.get("id"))
        except Exception:  # pragma: no cover - defensive, SDK shape may vary
            logger.debug("Could not extract data id from add() result", exc_info=True)
        return None

    # --- recall ---------------------------------------------------------

    async def recall(
        self,
        *,
        dataset: str,
        query: str,
        top_k: int = 10,
    ) -> RecallResult:
        """Query the user's memory graph using Cognee's multiple search types
        and normalize the results into a single `RecallResult`."""
        await self._ensure_user_configured(dataset)
        import cognee
        from cognee.api.v1.search import SearchType

        result = RecallResult()

        async def _safe_search(search_type: SearchType) -> list[Any]:
            try:
                return await cognee.search(
                    query_type=search_type,
                    query_text=query,
                    datasets=[dataset],
                    top_k=top_k,
                )
            except Exception:
                logger.warning("Cognee search failed for type=%s", search_type, exc_info=True)
                return []

        summaries, insights, chunks = await asyncio.gather(
            _safe_search(SearchType.SUMMARIES),
            _safe_search(SearchType.INSIGHTS),
            _safe_search(SearchType.CHUNKS),
        )

        result.summaries = [str(s) for s in summaries][:top_k]
        result.insights = [i if isinstance(i, dict) else {"text": str(i)} for i in insights][:top_k]
        result.chunks = [c if isinstance(c, dict) else {"text": str(c)} for c in chunks][:top_k]
        return result

    async def get_graph(self, *, dataset: str) -> dict[str, list[dict[str, Any]]]:
        """Return the raw node/edge structure of a user's knowledge graph."""
        await self._ensure_user_configured(dataset)
        from cognee.infrastructure.databases.graph import get_graph_engine

        graph_engine = await get_graph_engine()
        nodes: list[dict[str, Any]] = []
        edges: list[dict[str, Any]] = []
        try:
            graph = graph_engine.graph
            for node_id, node_data in graph.nodes(data=True):
                nodes.append({"id": str(node_id), **(node_data or {})})
            for source, target, edge_data in graph.edges(data=True):
                edges.append(
                    {
                        "source": str(source),
                        "target": str(target),
                        **(edge_data or {}),
                    }
                )
        except Exception:
            logger.warning("Failed to read graph engine contents", exc_info=True)
        return {"nodes": nodes, "edges": edges}

    # --- improve ------------------------------------------------------------

    async def improve(self, *, dataset: str) -> None:
        """Re-run cognify over the dataset so newly added memories get linked
        against existing entities/relationships (the "auto-optimizing
        pipeline" Cognee describes)."""
        await self._ensure_user_configured(dataset)
        import cognee

        await cognee.cognify([dataset])
        logger.info("Cognee improve() (re-cognify) complete for dataset=%s", dataset)

    # --- forget ---------------------------------------------------------

    async def forget(self, *, dataset: str, data_id: Optional[str] = None) -> None:
        """Remove a specific memory (if `data_id` given) or prune the whole
        dataset's memory graph."""
        await self._ensure_user_configured(dataset)
        import cognee

        if data_id:
            try:
                await cognee.delete(data_id=data_id, dataset_name=dataset)
                logger.info("Deleted data_id=%s from dataset=%s", data_id, dataset)
                return
            except Exception:
                logger.warning(
                    "cognee.delete() unavailable or failed for data_id=%s; "
                    "falling back to no-op. Consider pruning the full dataset instead.",
                    data_id,
                    exc_info=True,
                )
                return

        await cognee.prune.prune_data()
        logger.info("Pruned all data for dataset=%s", dataset)
