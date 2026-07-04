"""
GraphService

Cognee's graph engine returns raw nodes/edges with no notion of 2D layout or
of the UI's `GraphNodeKind` taxonomy (project/person/meeting/idea/task/
document). This service:
  1. Pulls the raw graph via `CogneeService.get_graph()`.
  2. Classifies each node into a `GraphNodeKind` from Cognee's node metadata.
  3. Computes an (x, y) layout with networkx so the frontend needs zero
     transformation -- it's already React-Flow-ready.
"""
from __future__ import annotations

import logging
from typing import Any

import networkx as nx

from app.models.orm import User
from app.schemas.common import GraphEdge, GraphNodeData, GraphNodeKind, GraphResponse
from app.services.cognee_service import CogneeService

logger = logging.getLogger(__name__)

_CANVAS_WIDTH = 900
_CANVAS_HEIGHT = 650
_PADDING = 60

_KIND_KEYWORD_MAP: dict[str, GraphNodeKind] = {
    "project": GraphNodeKind.project,
    "person": GraphNodeKind.person,
    "people": GraphNodeKind.person,
    "meeting": GraphNodeKind.meeting,
    "task": GraphNodeKind.task,
    "commitment": GraphNodeKind.task,
    "document": GraphNodeKind.document,
    "documentchunk": GraphNodeKind.document,
    "file": GraphNodeKind.document,
}


class GraphService:
    def __init__(self, cognee: CogneeService) -> None:
        self._cognee = cognee

    async def get_graph(self, user: User) -> GraphResponse:
        raw = await self._cognee.get_graph(dataset=user.cognee_dataset)
        raw_nodes: list[dict[str, Any]] = raw.get("nodes", [])
        raw_edges: list[dict[str, Any]] = raw.get("edges", [])

        if not raw_nodes:
            return GraphResponse(nodes=[], edges=[])

        nx_graph = nx.Graph()
        for node in raw_nodes:
            nx_graph.add_node(node["id"])
        for edge in raw_edges:
            if edge["source"] in nx_graph and edge["target"] in nx_graph:
                nx_graph.add_edge(edge["source"], edge["target"])

        positions = nx.spring_layout(nx_graph, seed=42, k=None)
        nodes: list[GraphNodeData] = []
        for node in raw_nodes:
            node_id = node["id"]
            pos = positions.get(node_id, (0.0, 0.0))
            x, y = self._scale_position(pos)
            nodes.append(
                GraphNodeData(
                    id=node_id,
                    label=self._label_for_node(node),
                    kind=self._kind_for_node(node),
                    x=x,
                    y=y,
                )
            )

        edges = [
            GraphEdge(
                id=f"e_{edge['source']}_{edge['target']}",
                source=edge["source"],
                target=edge["target"],
            )
            for edge in raw_edges
        ]

        return GraphResponse(nodes=nodes, edges=edges)

    @staticmethod
    def _scale_position(pos: tuple[float, float]) -> tuple[float, float]:
        # spring_layout returns coordinates roughly in [-1, 1]; rescale to canvas.
        nx_, ny_ = pos
        x = _PADDING + (nx_ + 1) / 2 * (_CANVAS_WIDTH - 2 * _PADDING)
        y = _PADDING + (ny_ + 1) / 2 * (_CANVAS_HEIGHT - 2 * _PADDING)
        return round(x, 1), round(y, 1)

    @staticmethod
    def _label_for_node(node: dict[str, Any]) -> str:
        for key in ("name", "label", "text", "title"):
            value = node.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()[:60]
        return str(node.get("id", "Unknown"))[:60]

    @staticmethod
    def _kind_for_node(node: dict[str, Any]) -> GraphNodeKind:
        candidate_fields = [
            str(node.get("type", "")),
            str(node.get("node_type", "")),
            str(node.get("category", "")),
        ]
        for candidate in candidate_fields:
            lowered = candidate.lower()
            for keyword, kind in _KIND_KEYWORD_MAP.items():
                if keyword in lowered:
                    return kind
        return GraphNodeKind.idea
