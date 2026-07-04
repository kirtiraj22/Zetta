"""
OpenRouterService

Dedicated wrapper around the OpenRouter chat completions API. This is the
ONLY place that talks to an LLM for response generation -- Cognee stays
responsible for memory/retrieval, OpenRouter only turns retrieved context
into natural language.
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterError(Exception):
    pass


class OpenRouterService:
    def __init__(self) -> None:
        self._base_url = str(settings.OPENROUTER_BASE_URL).rstrip("/")
        self._model = settings.OPENROUTER_MODEL

    def _headers(self) -> dict[str, str]:
        if not settings.OPENROUTER_API_KEY:
            raise OpenRouterError("OPENROUTER_API_KEY is not configured on the server.")
        return {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_SITE_NAME,
        }

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 1024,
    ) -> str:
        """Non-streaming completion. Used for the daily brief and other
        server-side generation that doesn't need to stream to the client."""
        payload = {
            "model": model or self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
        if resp.status_code != 200:
            logger.error("OpenRouter error %s: %s", resp.status_code, resp.text)
            raise OpenRouterError(f"OpenRouter request failed: {resp.status_code}")
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise OpenRouterError("Unexpected OpenRouter response shape.") from exc

    async def stream_complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        """Stream completion tokens as they arrive (SSE from OpenRouter)."""
        payload = {
            "model": model or self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    logger.error("OpenRouter stream error %s: %s", resp.status_code, body)
                    raise OpenRouterError(f"OpenRouter request failed: {resp.status_code}")

                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data_str = line[len("data:"):].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk: dict[str, Any] = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    choices = chunk.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {})
                    token = delta.get("content")
                    if token:
                        yield token
