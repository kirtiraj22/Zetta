"""
AuthService: turns a verified Supabase identity into a local `User` row.

The backend never issues or stores passwords/tokens itself -- Supabase Auth
(email/password + Google OAuth) is the source of truth for identity. This
service just mirrors the minimal identity fields locally so we can attach
foreign keys (memories, conversations, etc.) to a user.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import SupabaseUser
from app.models.orm import User

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_or_create_user(self, supabase_user: SupabaseUser) -> User:
        result = await self._db.execute(
            select(User).where(User.supabase_id == supabase_user.id)
        )
        user = result.scalar_one_or_none()
        if user is not None:
            # Keep the mirrored email fresh in case it changed upstream.
            if supabase_user.email and user.email != supabase_user.email:
                user.email = supabase_user.email
                await self._db.commit()
                await self._db.refresh(user)
            return user

        cognee_dataset = f"user_{supabase_user.id.replace('-', '')}"
        user = User(
            supabase_id=supabase_user.id,
            email=supabase_user.email,
            display_name=(supabase_user.email or "").split("@")[0] or None,
            cognee_dataset=cognee_dataset,
        )
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        logger.info("Created new local user for supabase_id=%s", supabase_user.id)
        return user
