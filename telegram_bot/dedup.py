import time
import hashlib
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class Deduplicator:
    def __init__(self, ttl_seconds: int = 86400):
        self._cache: dict[str, float] = {}
        self._ttl = ttl_seconds

    def _make_key(self, bpla_id: Optional[str], event_type: str, region: Optional[str]) -> str:
        raw = f"{bpla_id or ''}|{event_type}|{region or ''}"
        return hashlib.sha256(raw.encode()).hexdigest()

    async def is_duplicate(self, bpla_id: Optional[str], event_type: str, region: Optional[str],
                           db: Optional["AsyncSession"] = None) -> bool:
        if db and bpla_id:
            try:
                from sqlalchemy import select
                from app.models import Event
                result = await db.execute(
                    select(Event.sent_to_tg).where(Event.bpla_id == int(bpla_id)).limit(1)
                )
                row = result.scalar_one_or_none()
                if row is True:
                    return True
            except Exception:
                pass

        self._evict()
        key = self._make_key(bpla_id, event_type, region)
        return key in self._cache

    async def mark_seen(self, bpla_id: Optional[str], event_type: str, region: Optional[str],
                        db: Optional["AsyncSession"] = None):
        key = self._make_key(bpla_id, event_type, region)
        self._cache[key] = time.time()

        if db and bpla_id:
            try:
                from sqlalchemy import update
                from app.models import Event
                stmt = (
                    update(Event)
                    .where(Event.bpla_id == int(bpla_id))
                    .values(sent_to_tg=True)
                )
                await db.execute(stmt)
                await db.commit()
            except Exception:
                pass

    def _evict(self):
        now = time.time()
        expired = [k for k, ts in self._cache.items() if now - ts > self._ttl]
        for k in expired:
            del self._cache[k]

    @property
    def size(self) -> int:
        return len(self._cache)


dedup = Deduplicator()